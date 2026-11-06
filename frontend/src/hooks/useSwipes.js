import { createContext, useContext, useEffect, useState } from 'react';

const SWIPES_KEY = 'datedeck.swipes';

export const SwipesContext = createContext(null);

// Keeps any other fields already in datedeck.swipes, so later stories can add their own.
function readSwipes() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(SWIPES_KEY)) ?? {};
    if (
      typeof stored !== 'object' ||
      Array.isArray(stored) ||
      (stored.saved !== undefined && !Array.isArray(stored.saved)) ||
      (stored.hidden !== undefined && !Array.isArray(stored.hidden)) ||
      (Array.isArray(stored.saved) && stored.saved.some((id) => typeof id !== 'string')) ||
      (Array.isArray(stored.hidden) && stored.hidden.some((id) => typeof id !== 'string'))
    ) {
      throw new Error('Invalid swipe data');
    }
    return {
      storageError: null,
      swipes: {
        ...stored,
        saved: Array.isArray(stored.saved) ? stored.saved : [],
        hidden: Array.isArray(stored.hidden) ? stored.hidden : [],
      },
    };
  } catch {
    return {
      swipes: { saved: [], hidden: [] },
      storageError:
        'Could not read your saved and hidden ideas from this browser. Your choices will work for this visit, but cannot be kept after a reload.',
    };
  }
}

function writeSwipes(swipes) {
  try {
    window.localStorage.setItem(SWIPES_KEY, JSON.stringify(swipes));
    return null;
  } catch {
    return 'Could not store your choices in this browser. Your choices will work for this visit only.';
  }
}

function without(ids, id) {
  return ids.filter((current) => current !== id);
}

function randomIndex(size) {
  return Math.floor(Math.random() * size);
}

// A new random order that always has a different idea on top, so a shuffle is never a no-op.
function shuffled(ids) {
  const result = [...ids];
  for (let last = result.length - 1; last > 0; last -= 1) {
    const other = randomIndex(last + 1);
    [result[last], result[other]] = [result[other], result[last]];
  }
  if (result.length > 1 && result[0] === ids[0]) {
    const other = 1 + randomIndex(result.length - 1);
    [result[0], result[other]] = [result[other], result[0]];
  }
  return result;
}

/** The saved and hidden state behind SwipesProvider. Use useSwipes() in components. */
export function useSwipesState() {
  // Only `swipes` is stored. The undo history and deck order last until the page reloads, so a
  // reload can never bring a hidden idea back.
  const [state, setState] = useState(() => ({
    swipes: readSwipes(),
    history: [],
    deckOrder: [],
  }));
  const { swipes, history, deckOrder } = state;

  useEffect(() => {
    writeSwipes(swipes);
  }, [swipes]);

  // Follow choices made in another browser tab, so this tab's next write can't undo them and
  // bring a hidden idea back. Undo here forgets anything that tab has already taken back.
  useEffect(() => {
    function handleStorage(event) {
      if (event.key !== SWIPES_KEY && event.key !== null) return;
      const latest = readSwipes();
      setState((current) => ({
        ...current,
        swipes: latest,
        history: current.history.filter((entry) => latest[entry.list].includes(entry.id)),
      }));
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Saved and hidden are independent choices. An idea may be in both lists.
  function add(list, id) {
    setState((current) => {
      if (current.swipes[list].includes(id)) return current;
      return {
        ...current,
        swipes: { ...current.swipes, [list]: [...current.swipes[list], id] },
        history: [...current.history, { list, id }],
      };
    });
  }

  // Taking a choice back by hand also drops it from the history, so undo can't repeat it.
  function remove(list, id) {
    setState((current) => ({
      ...current,
      swipes: { ...current.swipes, [list]: without(current.swipes[list], id) },
      history: current.history.filter((entry) => entry.list !== list || entry.id !== id),
    }));
  }

  /** Returns every hidden idea to the deck. Saved ideas stay saved. */
  function unhideAll() {
    setState((current) => ({
      ...current,
      swipes: { ...current.swipes, hidden: [] },
      history: current.history.filter((entry) => entry.list !== 'hidden'),
    }));
  }

  /** Takes back the last save or hide and puts that idea on top of the deck. */
  function undo() {
    setState((current) => {
      const last = current.history.at(-1);
      if (!last) return current;
      return {
        swipes: { ...current.swipes, [last.list]: without(current.swipes[last.list], last.id) },
        history: current.history.slice(0, -1),
        deckOrder: [last.id, ...without(current.deckOrder, last.id)],
      };
    });
  }

  /** Gives the deck a new random order for the idea ids passed in. */
  function shuffle(ids) {
    const deckOrder = shuffled(ids);
    setState((current) => ({ ...current, deckOrder }));
  }

  return {
    saved: swipes.saved,
    hidden: swipes.hidden,
    canUndo: history.length > 0,
    deckOrder,
    save: (id) => add('saved', id),
    hide: (id) => add('hidden', id),
    unsave: (id) => remove('saved', id),
    unhide: (id) => remove('hidden', id),
    unhideAll,
    undo,
    shuffle,
  };
}

/** Saved and hidden idea ids, shared by every tab and stored in datedeck.swipes. */
export function useSwipes() {
  const swipes = useContext(SwipesContext);
  if (!swipes) throw new Error('useSwipes must be used inside <SwipesProvider>.');
  return swipes;
}
