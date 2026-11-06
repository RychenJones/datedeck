import { useCallback, useEffect, useRef, useState } from 'react';
import AddIdeaModal from '../components/AddIdeaModal/AddIdeaModal.jsx';
import AuthPanel from '../components/AuthPanel/AuthPanel.jsx';
import DateDeckHeader from '../components/DateDeckHeader/DateDeckHeader.jsx';
import FilterBar from '../components/FilterBar/FilterBar.jsx';
import { NO_FILTERS, useIdeaCounts } from '../hooks/useIdeas.js';
import { useAuth } from '../hooks/useAuth.js';
import Browse from './Browse.jsx';
import Deck from './Deck.jsx';
import Liked from './Liked.jsx';

import '../styles/home.css';

const PAGES = { deck: Deck, browse: Browse, liked: Liked };

// The same sample options each view gives useIdeas, so the filter counts match what it shows.
const DECK_IDEAS = { samplesWhenEmpty: true };
const BROWSE_IDEAS = { includeSamples: true };

// Main screen: the header, the account panel, the tab you picked and the add idea modal.
export default function Home() {
  const { user, signOut } = useAuth();
  const signedIn = Boolean(user);
  const [view, setView] = useState('deck');
  const [theme, setTheme] = useState('dark');

  // Shared by the deck and All ideas so both views respond to the same filters.
  const [filters, setFilters] = useState(NO_FILTERS);
  const counts = useIdeaCounts(filters, view === 'browse' ? BROWSE_IDEAS : DECK_IDEAS);

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAddIdeaOpen, setIsAddIdeaOpen] = useState(false);
  const accountPanel = useRef(null);
  const Page = PAGES[view];

  // Move focus into the account panel when it opens, so keyboard users land on the form.
  useEffect(() => {
    if (!isAccountOpen || signedIn) return;
    accountPanel.current?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    accountPanel.current?.querySelector('input, button')?.focus({ preventScroll: true });
  }, [isAccountOpen, signedIn]);

  function openAccount() {
    setIsAccountOpen(true);
  }

  const closeAddIdea = useCallback(() => setIsAddIdeaOpen(false), []);

  // Signing in happens in the account panel, so the modal gets out of its way.
  function signInToAddIdea() {
    closeAddIdea();
    openAccount();
  }

  return (
    <div className="app" data-theme={theme}>
      <div className="app-inner">
        <DateDeckHeader
          view={view}
          theme={theme}
          onViewChange={setView}
          onThemeToggle={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
          onAddIdea={() => setIsAddIdeaOpen(true)}
          isAddIdeaOpen={isAddIdeaOpen}
          user={user}
          onAccount={() => setIsAccountOpen((open) => !open)}
          isAccountOpen={isAccountOpen}
          onSignOut={() => {
            signOut();
            setIsAccountOpen(false);
          }}
        />

        <main className={view === 'deck' ? 'home home--deck' : 'home'}>
          <section
            id="account-panel"
            ref={accountPanel}
            aria-label="Your DateDeck account"
            hidden={!isAccountOpen || signedIn}
          >
            <AuthPanel
              onClose={() => setIsAccountOpen(false)}
              onSignedIn={() => setIsAccountOpen(false)}
            />
          </section>

          <div className={view === 'liked' ? undefined : 'home__workspace'}>
            {view !== 'liked' && (
              <FilterBar filters={filters} onChange={setFilters} counts={counts} />
            )}

            <div className="home__content">
              <Page filters={filters} signedIn={signedIn} onSignIn={openAccount} />
            </div>
          </div>
        </main>

        {isAddIdeaOpen && (
          <AddIdeaModal signedIn={signedIn} onSignIn={signInToAddIdea} onClose={closeAddIdea} />
        )}
      </div>
    </div>
  );
}
