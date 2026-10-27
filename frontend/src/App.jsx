import AuthProvider from './components/AuthProvider/AuthProvider.jsx';
import SwipesProvider from './components/SwipesProvider/SwipesProvider.jsx';
import Home from './pages/Home.jsx';

export default function App() {
  return (
    <AuthProvider>
      <SwipesProvider>
        <Home />
      </SwipesProvider>
    </AuthProvider>
  );
}
