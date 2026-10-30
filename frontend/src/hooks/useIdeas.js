import { useCallback, useEffect, useMemo, useState } from 'react';
import sampleIdeas from '../data/sample-ideas.json';
import { pb } from '../lib/pocketbase.js';

export const PAGE_SIZE = 20;

// Newest first; id breaks ties so pages never repeat or skip an idea.
const SORT = '-created,id';

export const NO_FILTERS = {
  areas: [],
  minPrice: null,
  maxPrice: null,
  categories: [],
  search: '',
};

export const EMPTY_IDEA_COUNTS = {
  locations: {},
  prices: {},
  categories: {},
};

// Joins "field = value" checks with || so any of the chosen values matches.
function anyOf(field, values, name, parts, params) {
  if (!values?.length) return;
  const checks = values.map((value, index) => {
    params[`${name}${index}`] = value;
    return `${field} = {:${name}${index}}`;
  });
  parts.push(`(${checks.join(' || ')})`);
}

/**
 * Turns the filter choices into a PocketBase filter string. Values always go
 * through pb.filter() parameters, never straight into the string.
 */
export function buildIdeasFilter(filters = NO_FILTERS) {
  const { areas, minPrice, maxPrice, categories, search } = { ...NO_FILTERS, ...filters };
  const parts = [];
  const params = {};

  anyOf('location', areas, 'area', parts, params);
  anyOf('category', categories, 'category', parts, params);
  if (minPrice != null) {
    parts.push('price >= {:minPrice}');
    params.minPrice = minPrice;
  }
  if (maxPrice != null) {
    parts.push('price <= {:maxPrice}');
    params.maxPrice = maxPrice;
  }
  if (search.trim()) {
    parts.push('(title ~ {:search} || description ~ {:search} || place_name ~ {:search})');
    params.search = search.trim();
  }

  return parts.length ? pb.filter(parts.join(' && '), params) : '';
}

// PocketBase stores only the photo's file name; IdeaCard needs a full link.
function withPhotoUrl(idea) {
  return idea.photo ? { ...idea, photo: pb.files.getURL(idea, idea.photo) } : idea;
}

export function matchesIdeaFilters(idea, filters, excludedFacet = null) {
  const { areas, minPrice, maxPrice, categories, search } = { ...NO_FILTERS, ...filters };
  const searchText = search.trim().toLowerCase();
  const searchableText = `${idea.title} ${idea.description} ${idea.place_name}`.toLowerCase();

  return (
    (excludedFacet === 'location' || !areas.length || areas.includes(idea.location)) &&
    (excludedFacet === 'price' || minPrice == null || idea.price >= minPrice) &&
    (excludedFacet === 'price' || maxPrice == null || idea.price <= maxPrice) &&
    (excludedFacet === 'category' || !categories.length || categories.includes(idea.category)) &&
    (!searchText || searchableText.includes(searchText))
  );
}

function matchesSampleFilters(idea, filters) {
  return matchesIdeaFilters(idea, filters);
}

function countFacet(ideas, filters, facet, value) {
  const candidateFilters = { ...filters };
  if (facet === 'location') candidateFilters.areas = [value];
  if (facet === 'category') candidateFilters.categories = [value];
  if (facet === 'price') {
    candidateFilters.minPrice = value.minPrice;
    candidateFilters.maxPrice = value.maxPrice;
  }
  return ideas.filter((idea) => matchesIdeaFilters(idea, candidateFilters, facet)).length;
}

function buildIdeaCounts(ideas, filters) {
  return {
    locations: {
      'Downtown Rexburg': countFacet(ideas, filters, 'location', 'Downtown Rexburg'),
      'Outside Rexburg': countFacet(ideas, filters, 'location', 'Outside Rexburg'),
      'BYU-Idaho Campus': countFacet(ideas, filters, 'location', 'BYU-Idaho Campus'),
    },
    prices: {
      free: countFacet(ideas, filters, 'price', { minPrice: 0, maxPrice: 0 }),
      'under-10': countFacet(ideas, filters, 'price', { minPrice: null, maxPrice: 9.99 }),
      '10-to-25': countFacet(ideas, filters, 'price', { minPrice: 10, maxPrice: 25 }),
      '25-plus': countFacet(ideas, filters, 'price', { minPrice: 25, maxPrice: null }),
    },
    categories: {
      Outdoors: countFacet(ideas, filters, 'category', 'Outdoors'),
      Active: countFacet(ideas, filters, 'category', 'Active'),
      Show: countFacet(ideas, filters, 'category', 'Show'),
      Animals: countFacet(ideas, filters, 'category', 'Animals'),
      Creative: countFacet(ideas, filters, 'category', 'Creative'),
      Food: countFacet(ideas, filters, 'category', 'Food'),
    },
  };
}

// An empty filtered page can just mean nothing matches, so ask again without the filter.
async function isDatabaseEmpty(list, filter) {
  if (list.totalItems > 0) return false;
  if (!filter) return true;
  const all = await pb.collection('dates').getList(1, 1, { requestKey: null });
  return all.totalItems === 0;
}

function mergeIdeas(primaryIdeas, additionalIdeas) {
  const seenIds = new Set(primaryIdeas.map((idea) => idea.id));
  return [...primaryIdeas, ...additionalIdeas.filter((idea) => !seenIds.has(idea.id))];
}

/**
 * Loads ideas from the PocketBase dates collection that match the filters,
 * PAGE_SIZE at a time. Call loadMore() to add the next page.
 *
 * includeSamples always mixes in the sample ideas (and uses them if PocketBase fails);
 * samplesWhenEmpty uses them only while the database has no ideas at all.
 *
 * @param {{areas?: string[], minPrice?: number|null, maxPrice?: number|null, categories?: string[], search?: string}} filters
 */
export function useIdeas(
  filters = NO_FILTERS,
  { includeSamples = false, samplesWhenEmpty = false } = {},
) {
  const filter = buildIdeasFilter(filters);
  const usesSamples = includeSamples || samplesWhenEmpty;
  const sampleFilterSource = usesSamples ? filters : NO_FILTERS;
  const samples = useMemo(
    () =>
      usesSamples
        ? sampleIdeas.filter((idea) => matchesSampleFilters(idea, sampleFilterSource))
        : [],
    [usesSamples, sampleFilterSource],
  );
  const mixedSamples = useMemo(() => (includeSamples ? samples : []), [includeSamples, samples]);
  const [request, setRequest] = useState({ filter, page: 1 });
  const [result, setResult] = useState({
    request: null,
    ideas: [],
    totalItems: 0,
    hasMore: false,
    error: null,
  });

  // New filters start again from the first page.
  if (request.filter !== filter) setRequest({ filter, page: 1 });

  useEffect(() => {
    let cancelled = false;

    pb.collection('dates')
      .getList(request.page, PAGE_SIZE, {
        filter: request.filter,
        sort: SORT,
        requestKey: null,
      })
      .then(async (list) => {
        const showSamples =
          samplesWhenEmpty && request.page === 1 && (await isDatabaseEmpty(list, request.filter));
        if (cancelled) return;
        if (showSamples) {
          setResult({
            request,
            ideas: samples,
            totalItems: samples.length,
            hasMore: false,
            error: null,
          });
          return;
        }
        setResult((current) => {
          const items = list.items.map(withPhotoUrl);
          const known = request.page === 1 ? [] : current.ideas;
          const knownIds = new Set(known.map((idea) => idea.id));
          const pageItems = request.page === 1 ? mergeIdeas(items, mixedSamples) : items;
          return {
            request,
            ideas: [...known, ...pageItems.filter((idea) => !knownIds.has(idea.id))],
            totalItems: list.totalItems + mixedSamples.length,
            hasMore: list.page < list.totalPages,
            error: null,
          };
        });
      })
      .catch((requestError) => {
        if (cancelled || requestError.isAbort) return;
        if (includeSamples) {
          setResult({
            request,
            ideas: samples,
            totalItems: samples.length,
            hasMore: false,
            error: null,
          });
          return;
        }
        setResult((current) => ({ ...current, request, error: requestError }));
      });

    return () => {
      cancelled = true;
    };
  }, [includeSamples, samplesWhenEmpty, request, samples, mixedSamples]);

  const isDone = result.request === request;
  const canLoadMore = isDone && result.hasMore && !result.error;

  const loadMore = useCallback(() => {
    if (!canLoadMore) return;
    setRequest((current) => ({ ...current, page: current.page + 1 }));
  }, [canLoadMore]);

  let status = 'ready';
  if (isDone && result.error) status = 'error';
  else if (!isDone) status = request.page === 1 ? 'loading' : 'loading-more';

  return {
    ideas: status === 'loading' ? [] : result.ideas,
    status,
    error: isDone ? result.error : null,
    totalItems: result.totalItems,
    hasMore: result.hasMore,
    loadMore,
  };
}

export function useIdeaCounts(filters = NO_FILTERS) {
  const [counts, setCounts] = useState(EMPTY_IDEA_COUNTS);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve()
      .then(() =>
        pb.collection('dates').getFullList({
          filter: '',
          sort: SORT,
          requestKey: null,
        }),
      )
      .then((items) => {
        if (cancelled) return;
        const knownIds = new Set(items.map((idea) => idea.id));
        const allIdeas = [...items, ...sampleIdeas.filter((idea) => !knownIds.has(idea.id))];
        setCounts(buildIdeaCounts(allIdeas, filters));
      })
      .catch(() => {
        if (!cancelled) setCounts(buildIdeaCounts(sampleIdeas, filters));
      });

    return () => {
      cancelled = true;
    };
  }, [filters]);

  return counts;
}
