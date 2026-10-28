import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useSwipeIdeas } from './useSwipeIdeas.js';
import { pb } from '../lib/pocketbase.js';

vi.mock('../lib/pocketbase.js', () => ({
  pb: {
    collection: vi.fn(),
    filter: vi.fn(() => 'safe filter'),
    files: { getURL: vi.fn(() => 'https://example.com/photo.jpg') },
  },
}));
const getFullList = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  pb.collection.mockReturnValue({ getFullList });
});

it('loads saved and hidden records directly by ID with safe filters and photo URLs', async () => {
  getFullList.mockResolvedValue([{ id: 'saved-id', photo: 'photo.jpg' }, { id: 'hidden-id' }]);
  const { result } = renderHook(() => useSwipeIdeas(['saved-id'], ['hidden-id']));
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(pb.collection).toHaveBeenCalledWith('dates');
  expect(pb.filter).toHaveBeenCalledWith('id = {:id0} || id = {:id1}', {
    id0: 'hidden-id',
    id1: 'saved-id',
  });
  expect(getFullList).toHaveBeenCalledWith({ filter: 'safe filter', requestKey: null });
  expect(result.current.ideas).toEqual([
    { id: 'saved-id', photo: 'https://example.com/photo.jpg' },
    { id: 'hidden-id' },
  ]);
});

it('reports a load error instead of presenting a failed request as an empty list', async () => {
  getFullList.mockRejectedValue(new Error('offline'));
  const { result } = renderHook(() => useSwipeIdeas(['saved-id'], []));
  await waitFor(() => expect(result.current.status).toBe('error'));
});

it('ignores an old response after the saved choices change', async () => {
  let finishOldRequest;
  getFullList.mockReturnValueOnce(
    new Promise((resolve) => {
      finishOldRequest = resolve;
    }),
  );
  getFullList.mockResolvedValueOnce([{ id: 'new-id' }]);
  const { result, rerender } = renderHook(({ saved }) => useSwipeIdeas(saved, []), {
    initialProps: { saved: ['old-id'] },
  });
  rerender({ saved: ['new-id'] });
  await waitFor(() => expect(result.current.ideas).toEqual([{ id: 'new-id' }]));
  finishOldRequest([{ id: 'old-id' }]);
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(result.current.ideas).toEqual([{ id: 'new-id' }]);
});
