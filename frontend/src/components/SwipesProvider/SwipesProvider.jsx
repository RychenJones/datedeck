import { SwipesContext, useSwipesState } from '../../hooks/useSwipes.js';
import { useSwipeIdeas } from '../../hooks/useSwipeIdeas.js';

/** Shares one set of saved and hidden ideas with every tab (DD-09). */
export default function SwipesProvider({ children }) {
  const swipes = useSwipesState();
  const lists = useSwipeIdeas(swipes.saved, swipes.hidden);
  return <SwipesContext value={{ ...swipes, lists }}>{children}</SwipesContext>;
}
