import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pb } from '../lib/pocketbase.js';
import { useIdeas } from './useIdeas.js';

vi.mock('../lib/pocketbase.js', () => ({
  pb: {
    collection: vi.fn(),
  },
}));

const collection = {
  getFullList: vi.fn(),
  create: vi.fn(),
};

describe('useIdeas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pb.collection.mockReturnValue(collection);
    collection.getFullList.mockResolvedValue([]);
    collection.create.mockResolvedValue({ id: 'new-idea', title: 'New idea' });
  });

  it('loads ideas and reports a ready status', async () => {
    const ideas = [{ id: 'idea-1', title: 'Picnic' }];
    collection.getFullList.mockResolvedValue(ideas);

    const { result } = renderHook(() => useIdeas());

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(result.current.ideas).toEqual(ideas);
    expect(result.current.error).toBeNull();
    expect(collection.getFullList).toHaveBeenCalledWith({
      sort: '-created',
      requestKey: null,
    });
  });

  it('reports an error when loading ideas fails', async () => {
    const error = new Error('PocketBase is unavailable');
    collection.getFullList.mockRejectedValue(error);

    const { result } = renderHook(() => useIdeas());

    await waitFor(() => expect(result.current.status).toBe('error'));

    expect(result.current.error).toBe(error);
  });

  it('adds an idea and includes it in the list', async () => {
    const newIdea = { id: 'new-idea', title: 'New idea' };
    collection.create.mockResolvedValue(newIdea);
    const { result } = renderHook(() => useIdeas());

    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => {
      await result.current.addIdea({ title: 'New idea' });
    });

    expect(collection.create).toHaveBeenCalledWith({ title: 'New idea' }, { requestKey: null });
    expect(result.current.ideas).toEqual([newIdea]);
  });
});
