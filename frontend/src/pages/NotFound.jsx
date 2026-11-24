import { useEffect } from 'react';
import { ArrowLeft, MapPinX } from 'lucide-react';

import '../styles/home.css';

// Shown for any link the app does not know (DD-28), with a way back to the deck.
export default function NotFound() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Page not found · DateDeck';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="app" data-theme="dark">
      <main className="app-inner not-found">
        <div className="deck__empty">
          <span className="deck__empty-icon" aria-hidden="true">
            <MapPinX />
          </span>
          <h1>Page not found</h1>
          <p>
            This link does not go anywhere in DateDeck. It may be old or have a typo. Your liked
            ideas are still here.
          </p>
          <a className="home__empty-action not-found__link" href="/">
            <ArrowLeft aria-hidden="true" />
            Back to the deck
          </a>
        </div>
      </main>
    </div>
  );
}
