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

function matchesSampleFilters(idea, filters) {
  const { areas, minPrice, maxPrice, categories, search } = { ...NO_FILTERS, ...filters };
  const searchText = search.trim().toLowerCase();
  const searchableText = `${idea.title} ${idea.description} ${idea.place_name}`.toLowerCase();

  return (
    (!areas.length || areas.includes(idea.location)) &&
    (minPrice == null || idea.price >= minPrice) &&
    (maxPrice == null || idea.price <= maxPrice) &&
    (!categories.length || categories.includes(idea.category)) &&
    (!searchText || searchableText.includes(searchText))
  );
}

function mergeIdeas(primaryIdeas, additionalIdeas) {
  const seenIds = new Set(primaryIdeas.map((idea) => idea.id));
  return [...primaryIdeas, ...additionalIdeas.filter((idea) => !seenIds.has(idea.id))];
}

/**
 * Loads ideas from the PocketBase dates collection that match the filters,
 * PAGE_SIZE at a time. Call loadMore() to add the next page.
 *
 * @param {{areas?: string[], minPrice?: number|null, maxPrice?: number|null, categories?: string[], search?: string}} filters
 */
export function useIdeas(filters = NO_FILTERS, { includeSamples = false } = {}) {
  const filter = buildIdeasFilter(filters);
  const sampleFilterSource = includeSamples ? filters : NO_FILTERS;
  const samples = useMemo(
    () =>
      includeSamples
        ? sampleIdeas.filter((idea) => matchesSampleFilters(idea, sampleFilterSource))
        : [],
    [includeSamples, sampleFilterSource],
  );
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
      .then((list) => {
        if (cancelled) return;
        setResult((current) => {
          const items = list.items.map(withPhotoUrl);
          const known = request.page === 1 ? [] : current.ideas;
          const knownIds = new Set(known.map((idea) => idea.id));
          const pageItems = request.page === 1 ? mergeIdeas(items, samples) : items;
          return {
            request,
            ideas: [...known, ...pageItems.filter((idea) => !knownIds.has(idea.id))],
            totalItems: list.totalItems + samples.length,
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
  }, [includeSamples, request, samples]);

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
