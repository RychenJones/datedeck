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

/** The saved and hidden state behind SwipesProvider. Use useSwipes() in components. */
export function useSwipesState() {
  const [initial] = useState(readSwipes);
  const [swipes, setSwipes] = useState(initial.swipes);
  const [writeError, setWriteError] = useState(null);

  useEffect(() => {
    // Never overwrite data we could not read.
    let active = true;
    if (!initial.storageError) {
      const error = writeSwipes(swipes);
      Promise.resolve().then(() => {
        if (active) setWriteError(error);
      });
    }
    return () => {
      active = false;
    };
  }, [swipes, initial.storageError]);

  // An idea is either saved or hidden, never both.
  function save(id) {
    setSwipes((current) => ({
      ...current,
      saved: current.saved.includes(id) ? current.saved : [...current.saved, id],
      hidden: without(current.hidden, id),
    }));
  }

  function hide(id) {
    setSwipes((current) => ({
      ...current,
      saved: without(current.saved, id),
      hidden: current.hidden.includes(id) ? current.hidden : [...current.hidden, id],
    }));
  }

  function unsave(id) {
    setSwipes((current) => ({ ...current, saved: without(current.saved, id) }));
  }

  function unhide(id) {
    setSwipes((current) => ({ ...current, hidden: without(current.hidden, id) }));
  }

  function toggleSave(id) {
    setSwipes((current) => ({
      ...current,
      saved: current.saved.includes(id) ? without(current.saved, id) : [...current.saved, id],
      hidden: without(current.hidden, id),
    }));
  }

  return {
    saved: swipes.saved,
    hidden: swipes.hidden,
    save,
    hide,
    unsave,
    unhide,
    toggleSave,
    storageError: initial.storageError || writeError,
  };
}

/** Saved and hidden idea ids, shared by every tab and stored in datedeck.swipes. */
export function useSwipes() {
  const swipes = useContext(SwipesContext);
  if (!swipes) throw new Error('useSwipes must be used inside <SwipesProvider>.');
  return swipes;
}
