import SwipesProvider from './components/SwipesProvider/SwipesProvider.jsx';
import Home from './pages/Home.jsx';

export default function App() {
  return (
    <SwipesProvider>
      <Home />
    </SwipesProvider>
  );
}
