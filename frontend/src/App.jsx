import AuthProvider from './components/AuthProvider/AuthProvider.jsx';
import SwipesProvider from './components/SwipesProvider/SwipesProvider.jsx';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';

// The app has one page; the tabs live in Home. Any other path is a link we do not know (DD-28).
const KNOWN_PATHS = ['/', '/index.html'];

export default function App() {
  if (!KNOWN_PATHS.includes(window.location.pathname)) return <NotFound />;

  return (
    <AuthProvider>
      <SwipesProvider>
        <Home />
      </SwipesProvider>
    </AuthProvider>
  );
}
