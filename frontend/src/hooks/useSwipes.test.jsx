import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SwipesProvider from '../components/SwipesProvider/SwipesProvider.jsx';
import { useSwipes } from './useSwipes.js';

vi.mock('../lib/pocketbase.js', () => ({
  pb: {
    filter: vi.fn(),
    collection: () => ({ getFullList: vi.fn().mockResolvedValue([]) }),
  },
}));

function renderSwipes() {
  return renderHook(() => useSwipes(), { wrapper: SwipesProvider });
}

function stored() {
  return JSON.parse(window.localStorage.getItem('datedeck.swipes'));
}

describe('useSwipes', () => {
  afterEach(() => vi.restoreAllMocks());
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('saves and hides ideas and stores them in datedeck.swipes', () => {
    const { result } = renderSwipes();

    act(() => result.current.save('idea-1'));
    act(() => result.current.hide('idea-2'));

    expect(result.current.saved).toEqual(['idea-1']);
    expect(result.current.hidden).toEqual(['idea-2']);
    expect(stored()).toEqual({ saved: ['idea-1'], hidden: ['idea-2'] });
  });

  it('unsaves and unhides ideas', () => {
    const { result } = renderSwipes();
    act(() => result.current.save('idea-1'));
    act(() => result.current.hide('idea-2'));

    act(() => result.current.unsave('idea-1'));
    act(() => result.current.unhide('idea-2'));

    expect(result.current.saved).toEqual([]);
    expect(result.current.hidden).toEqual([]);
    expect(stored()).toEqual({ saved: [], hidden: [] });
  });

  it('moves an idea from hidden to saved instead of keeping it in both', () => {
    const { result } = renderSwipes();

    act(() => result.current.hide('idea-1'));
    act(() => result.current.save('idea-1'));
    act(() => result.current.save('idea-1'));

    expect(result.current.saved).toEqual(['idea-1']);
    expect(result.current.hidden).toEqual([]);
  });

  it('remembers choices from an earlier visit and keeps other stored fields', () => {
    window.localStorage.setItem(
      'datedeck.swipes',
      JSON.stringify({ saved: ['idea-1'], hidden: [], version: 1 }),
    );
    const { result } = renderSwipes();

    act(() => result.current.hide('idea-2'));

    expect(result.current.saved).toEqual(['idea-1']);
    expect(stored()).toEqual({ saved: ['idea-1'], hidden: ['idea-2'], version: 1 });
  });

  it('starts empty when the stored value is broken', () => {
    window.localStorage.setItem('datedeck.swipes', 'not json');

    const { result } = renderSwipes();

    expect(result.current.saved).toEqual([]);
    expect(result.current.hidden).toEqual([]);
    expect(result.current.storageError).toMatch(/could not read/i);
    expect(window.localStorage.getItem('datedeck.swipes')).toBe('not json');
  });

  it('toggles a saved idea without changing other choices or fields', () => {
    localStorage.setItem(
      'datedeck.swipes',
      JSON.stringify({ saved: [], hidden: ['other'], version: 4 }),
    );
    const { result } = renderSwipes();
    act(() => result.current.toggleSave('idea-1'));
    expect(result.current.saved).toEqual(['idea-1']);
    act(() => result.current.toggleSave('idea-1'));
    expect(stored()).toEqual({ saved: [], hidden: ['other'], version: 4 });
  });

  it('explains blocked storage reads and still allows choices for this visit', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { result } = renderSwipes();
    act(() => result.current.toggleSave('idea-1'));
    expect(result.current.saved).toEqual(['idea-1']);
    expect(result.current.storageError).toMatch(/could not read/i);
  });

  it('explains failed storage writes and still allows choices for this visit', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full');
    });
    const { result } = renderSwipes();
    act(() => result.current.save('idea-1'));
    expect(result.current.saved).toEqual(['idea-1']);
    await waitFor(() => expect(result.current.storageError).toMatch(/could not store/i));
  });

  it('explains the mistake when used outside SwipesProvider', () => {
    expect(() => renderHook(() => useSwipes())).toThrow(
      'useSwipes must be used inside <SwipesProvider>.',
    );
  });
});
