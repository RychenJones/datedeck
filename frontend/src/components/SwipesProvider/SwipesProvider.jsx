import { SwipesContext, useSwipesState } from '../../hooks/useSwipes.js';

/** Shares one set of saved and hidden ideas with every tab (DD-09). */
export default function SwipesProvider({ children }) {
  const swipes = useSwipesState();
  return <SwipesContext value={swipes}>{children}</SwipesContext>;
}
