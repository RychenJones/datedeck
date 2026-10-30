import { createContext, useContext, useEffect, useState } from 'react';

const SWIPES_KEY = 'datedeck.swipes';

export const SwipesContext = createContext(null);

// Keeps any other fields already in datedeck.swipes, so later stories can add their own.
function readSwipes() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(SWIPES_KEY)) ?? {};
    return {
      ...stored,
      saved: Array.isArray(stored.saved) ? stored.saved : [],
      hidden: Array.isArray(stored.hidden) ? stored.hidden : [],
    };
  } catch {
    return { saved: [], hidden: [] };
  }
}

function writeSwipes(swipes) {
  try {
    window.localStorage.setItem(SWIPES_KEY, JSON.stringify(swipes));
  } catch {
    // Private browsing can block storage; choices still work until a reload.
  }
}

function without(ids, id) {
  return ids.filter((current) => current !== id);
}

/** The saved and hidden state behind SwipesProvider. Use useSwipes() in components. */
export function useSwipesState() {
  const [swipes, setSwipes] = useState(readSwipes);

  useEffect(() => {
    writeSwipes(swipes);
  }, [swipes]);

  // Saved and hidden are independent choices. An idea may be in both lists.
  function save(id) {
    setSwipes((current) => ({
      ...current,
      saved: current.saved.includes(id) ? current.saved : [...current.saved, id],
    }));
  }

  function hide(id) {
    setSwipes((current) => ({
      ...current,
      hidden: current.hidden.includes(id) ? current.hidden : [...current.hidden, id],
    }));
  }

  function unsave(id) {
    setSwipes((current) => ({ ...current, saved: without(current.saved, id) }));
  }

  function unhide(id) {
    setSwipes((current) => ({ ...current, hidden: without(current.hidden, id) }));
  }

  return { saved: swipes.saved, hidden: swipes.hidden, save, hide, unsave, unhide };
}

/** Saved and hidden idea ids, shared by every tab and stored in datedeck.swipes. */
export function useSwipes() {
  const swipes = useContext(SwipesContext);
  if (!swipes) throw new Error('useSwipes must be used inside <SwipesProvider>.');
  return swipes;
}
