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

  it('allows an idea to be saved and hidden independently', () => {
    const { result } = renderSwipes();

    act(() => result.current.hide('idea-1'));
    act(() => result.current.save('idea-1'));
    act(() => result.current.save('idea-1'));

    expect(result.current.saved).toEqual(['idea-1']);
    expect(result.current.hidden).toEqual(['idea-1']);
    expect(stored()).toEqual({ saved: ['idea-1'], hidden: ['idea-1'] });
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

  it('undoes the last save or hide, newest first', () => {
    const { result } = renderSwipes();
    act(() => result.current.save('idea-1'));
    act(() => result.current.hide('idea-2'));

    act(() => result.current.undo());
    expect(result.current.hidden).toEqual([]);
    expect(result.current.saved).toEqual(['idea-1']);
    expect(result.current.canUndo).toBe(true);

    act(() => result.current.undo());
    expect(result.current.saved).toEqual([]);
    expect(result.current.canUndo).toBe(false);
    expect(stored()).toEqual({ saved: [], hidden: [] });
  });

  it('puts an undone idea at the front of the deck order', () => {
    const { result } = renderSwipes();
    act(() => result.current.hide('idea-1'));
    act(() => result.current.hide('idea-2'));

    act(() => result.current.undo());
    act(() => result.current.undo());

    expect(result.current.deckOrder).toEqual(['idea-1', 'idea-2']);
  });

  it('does nothing when there is nothing to undo', () => {
    window.localStorage.setItem('datedeck.swipes', JSON.stringify({ saved: [], hidden: ['a'] }));
    const { result } = renderSwipes();

    expect(result.current.canUndo).toBe(false);
    act(() => result.current.undo());

    expect(result.current.hidden).toEqual(['a']);
  });

  it('only counts a choice once when the same idea is saved twice', () => {
    const { result } = renderSwipes();
    act(() => result.current.save('idea-1'));
    act(() => result.current.save('idea-1'));

    act(() => result.current.undo());

    expect(result.current.saved).toEqual([]);
    expect(result.current.canUndo).toBe(false);
  });

  it('brings back every hidden idea and forgets those hides in the undo history', () => {
    const { result } = renderSwipes();
    act(() => result.current.save('idea-1'));
    act(() => result.current.hide('idea-2'));
    act(() => result.current.hide('idea-3'));

    act(() => result.current.unhideAll());

    expect(result.current.hidden).toEqual([]);
    expect(result.current.saved).toEqual(['idea-1']);
    act(() => result.current.undo());
    expect(result.current.saved).toEqual([]);
    expect(result.current.canUndo).toBe(false);
  });

  it('forgets a choice in the undo history once you take it back by hand', () => {
    const { result } = renderSwipes();
    act(() => result.current.save('idea-1'));
    act(() => result.current.hide('idea-2'));

    act(() => result.current.unhide('idea-2'));
    act(() => result.current.undo());

    expect(result.current.saved).toEqual([]);
    expect(result.current.hidden).toEqual([]);
    expect(result.current.canUndo).toBe(false);
  });

  it('shuffles the ids it is given and always changes the top one', () => {
    const { result } = renderSwipes();
    const ids = ['a', 'b', 'c', 'd'];

    for (let round = 0; round < 50; round += 1) {
      act(() => result.current.shuffle(ids));
      expect([...result.current.deckOrder].sort()).toEqual(ids);
      expect(result.current.deckOrder[0]).not.toBe('a');
    }
  });

  it('keeps undo history and deck order out of datedeck.swipes', () => {
    const { result } = renderSwipes();
    act(() => result.current.hide('a'));
    act(() => result.current.shuffle(['b', 'c']));

    expect(stored()).toEqual({ saved: [], hidden: ['a'] });
  });

  it('keeps an idea hidden in another tab when this tab saves something later', () => {
    const { result } = renderSwipes();

    window.localStorage.setItem(
      'datedeck.swipes',
      JSON.stringify({ saved: [], hidden: ['other-tab'] }),
    );
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'datedeck.swipes' })));
    act(() => result.current.save('idea-1'));

    expect(result.current.hidden).toEqual(['other-tab']);
    expect(stored()).toEqual({ saved: ['idea-1'], hidden: ['other-tab'] });
  });

  it('forgets a choice in the undo history once another tab takes it back', () => {
    const { result } = renderSwipes();
    act(() => result.current.hide('idea-1'));

    window.localStorage.setItem('datedeck.swipes', JSON.stringify({ saved: [], hidden: [] }));
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'datedeck.swipes' })));

    expect(result.current.hidden).toEqual([]);
    expect(result.current.canUndo).toBe(false);
  });

  it('ignores changes to other storage keys', () => {
    const { result } = renderSwipes();
    act(() => result.current.hide('idea-1'));

    window.localStorage.setItem('something-else', 'x');
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'something-else' })));

    expect(result.current.hidden).toEqual(['idea-1']);
    expect(result.current.canUndo).toBe(true);
  });

  it('explains the mistake when used outside SwipesProvider', () => {
    expect(() => renderHook(() => useSwipes())).toThrow(
      'useSwipes must be used inside <SwipesProvider>.',
    );
  });
});
