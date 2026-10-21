import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pb } from '../lib/pocketbase.js';
import { useAddIdea } from './useAddIdea.js';

vi.mock('../lib/pocketbase.js', () => ({
  pb: {
    collection: vi.fn(),
  },
}));

const collection = {
  create: vi.fn(),
};

describe('useAddIdea', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pb.collection.mockReturnValue(collection);
  });

  it('adds an idea to the dates collection', async () => {
    const newIdea = { id: 'new-idea', title: 'New idea' };
    collection.create.mockResolvedValue(newIdea);
    const { result } = renderHook(() => useAddIdea());

    let added;
    await act(async () => {
      added = await result.current.addIdea({ title: 'New idea' });
    });

    expect(pb.collection).toHaveBeenCalledWith('dates');
    expect(collection.create).toHaveBeenCalledWith({ title: 'New idea' }, { requestKey: null });
    expect(added).toEqual(newIdea);
  });

  it('reports an error when adding fails', async () => {
    const error = new Error('PocketBase is unavailable');
    collection.create.mockRejectedValue(error);
    const { result } = renderHook(() => useAddIdea());

    await act(async () => {
      await expect(result.current.addIdea({ title: 'New idea' })).rejects.toBe(error);
    });

    expect(result.current.error).toBe(error);
  });
});
