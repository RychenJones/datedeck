import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pb } from '../lib/pocketbase.js';
import { PAGE_SIZE, buildIdeasFilter, useIdeas } from './useIdeas.js';

vi.mock('../lib/pocketbase.js', () => ({
  pb: {
    collection: vi.fn(),
    // Like the real pb.filter: puts each quoted value in its {:name} slot.
    filter: vi.fn((expression, params) =>
      expression.replace(/\{:(\w+)\}/g, (_, name) => JSON.stringify(params[name])),
    ),
    files: { getURL: vi.fn((record, file) => `http://pb.test/${record.id}/${file}`) },
  },
}));

const collection = {
  getList: vi.fn(),
};

function makeIdeas(count, start = 1) {
  return Array.from({ length: count }, (_, index) => ({
    id: `idea-${start + index}`,
    title: `Idea ${start + index}`,
    photo: '',
  }));
}

// Answers getList like PocketBase does, from a list of ideas.
function serve(allIdeas) {
  collection.getList.mockImplementation(async (page, perPage) => ({
    page,
    perPage,
    totalItems: allIdeas.length,
    totalPages: Math.ceil(allIdeas.length / perPage),
    items: allIdeas.slice((page - 1) * perPage, page * perPage),
  }));
}

describe('useIdeas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pb.collection.mockReturnValue(collection);
    serve([]);
  });

  it('loads the first page of ideas, newest first, and reports a ready status', async () => {
    const ideas = makeIdeas(2);
    serve(ideas);

    const { result } = renderHook(() => useIdeas());

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(result.current.ideas).toEqual(ideas);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.hasMore).toBe(false);
    expect(pb.collection).toHaveBeenCalledWith('dates');
    expect(collection.getList).toHaveBeenCalledWith(1, PAGE_SIZE, {
      filter: '',
      sort: '-created,id',
      requestKey: null,
    });
  });

  it('reports an error when loading ideas fails', async () => {
    const error = new Error('PocketBase is unavailable');
    collection.getList.mockRejectedValue(error);

    const { result } = renderHook(() => useIdeas());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe(error);
  });

  it('ignores a cancelled request', async () => {
    collection.getList.mockRejectedValue(
      Object.assign(new Error('autocancelled'), { isAbort: true }),
    );

    const { result } = renderHook(() => useIdeas());

    await act(async () => {});
    expect(result.current.status).toBe('loading');
    expect(result.current.error).toBeNull();
  });

  it('adds the next page when you load more', async () => {
    const ideas = makeIdeas(PAGE_SIZE + 5);
    serve(ideas);
    const { result } = renderHook(() => useIdeas());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(result.current.ideas).toHaveLength(PAGE_SIZE);
    expect(result.current.hasMore).toBe(true);

    act(() => result.current.loadMore());
    expect(result.current.status).toBe('loading-more');
    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(result.current.ideas).toEqual(ideas);
    expect(result.current.hasMore).toBe(false);
    expect(collection.getList).toHaveBeenLastCalledWith(2, PAGE_SIZE, expect.any(Object));
  });

  it('starts again from the first page when the filters change', async () => {
    serve(makeIdeas(PAGE_SIZE + 5));
    const { result, rerender } = renderHook((filters) => useIdeas(filters), {
      initialProps: { areas: [] },
    });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.ideas).toHaveLength(PAGE_SIZE + 5));

    const campusIdeas = makeIdeas(1, 100);
    serve(campusIdeas);
    rerender({ areas: ['BYU-Idaho Campus'] });

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.ideas).toEqual(campusIdeas);
    expect(collection.getList).toHaveBeenLastCalledWith(1, PAGE_SIZE, {
      filter: '(location = "BYU-Idaho Campus")',
      sort: '-created,id',
      requestKey: null,
    });
  });

  it('does not load again when the same filters are passed as a new object', async () => {
    serve(makeIdeas(1));
    const { result, rerender } = renderHook((filters) => useIdeas(filters), {
      initialProps: { categories: ['Food'] },
    });
    await waitFor(() => expect(result.current.status).toBe('ready'));

    rerender({ categories: ['Food'] });

    expect(result.current.status).toBe('ready');
    expect(collection.getList).toHaveBeenCalledTimes(1);
  });

  it('shows the sample ideas when the database has no ideas yet', async () => {
    const { result } = renderHook(() => useIdeas(undefined, { samplesWhenEmpty: true }));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.ideas.map((idea) => idea.id)).toEqual([
      'sample-1',
      'sample-2',
      'sample-3',
      'sample-4',
      'sample-5',
    ]);
    expect(result.current.totalItems).toBe(5);
    expect(result.current.hasMore).toBe(false);
  });

  it('shows only database ideas when the database has some', async () => {
    const ideas = makeIdeas(2);
    serve(ideas);

    const { result } = renderHook(() => useIdeas(undefined, { samplesWhenEmpty: true }));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.ideas).toEqual(ideas);
  });

  it('shows no sample ideas when the filters match nothing in a database that has ideas', async () => {
    collection.getList.mockImplementation(async (page, perPage, { filter }) => {
      const items = filter ? [] : makeIdeas(1);
      return { page, perPage, totalItems: items.length, totalPages: items.length, items };
    });

    const { result } = renderHook(() =>
      useIdeas({ categories: ['Outdoors'] }, { samplesWhenEmpty: true }),
    );

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.ideas).toEqual([]);
  });

  it('gives each photo its full PocketBase link', async () => {
    serve([{ id: 'idea-1', title: 'Picnic', photo: 'picnic.jpg' }]);

    const { result } = renderHook(() => useIdeas());

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.ideas[0].photo).toBe('http://pb.test/idea-1/picnic.jpg');
  });
});

describe('buildIdeasFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an empty filter when nothing is chosen', () => {
    expect(buildIdeasFilter()).toBe('');
    expect(buildIdeasFilter({ search: '   ' })).toBe('');
    expect(pb.filter).not.toHaveBeenCalled();
  });

  it('matches any chosen area, a price range, any chosen category and search text', () => {
    const filter = buildIdeasFilter({
      areas: ['Downtown Rexburg', 'Outside Rexburg'],
      minPrice: 10,
      maxPrice: 25,
      categories: ['Food'],
      search: ' pizza ',
    });

    expect(pb.filter).toHaveBeenCalledWith(
      '(location = {:area0} || location = {:area1}) && (category = {:category0}) && ' +
        'price >= {:minPrice} && price <= {:maxPrice} && ' +
        '(title ~ {:search} || description ~ {:search} || place_name ~ {:search})',
      {
        area0: 'Downtown Rexburg',
        area1: 'Outside Rexburg',
        category0: 'Food',
        minPrice: 10,
        maxPrice: 25,
        search: 'pizza',
      },
    );
    expect(filter).toContain('location = "Downtown Rexburg"');
  });

  it('finds free ideas with a maximum price of 0', () => {
    expect(buildIdeasFilter({ maxPrice: 0 })).toBe('price <= 0');
  });
});
