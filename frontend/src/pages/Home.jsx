import { useEffect, useRef, useState } from 'react';
import AddIdeaForm from '../components/AddIdeaForm/AddIdeaForm.jsx';
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

// Main screen: the header, the account panel, the tab you picked and the form to add an idea.
// Main screen: the header, the account panel, the tab you picked and the form to add an idea.
export default function Home() {
  const { user } = useAuth();
  const [view, setView] = useState('deck');
  const [theme, setTheme] = useState('dark');

  // Shared by the deck and All ideas so both views respond to the same filters.
  const [filters, setFilters] = useState(NO_FILTERS);
  const counts = useIdeaCounts(filters);

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountPanel = useRef(null);
  const addIdeaPanel = useRef(null);
  const Page = PAGES[view];

  // Move focus into the account panel when it opens, so keyboard users land on the form.
  useEffect(() => {
    if (!isAccountOpen) return;
    accountPanel.current?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    accountPanel.current?.querySelector('input, button')?.focus({ preventScroll: true });
  }, [isAccountOpen]);

  function openAccount() {
    setIsAccountOpen(true);
  }

  function showAddIdeaForm() {
    addIdeaPanel.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
    addIdeaPanel.current?.querySelector('input, button')?.focus({ preventScroll: true });
  }

  return (
    <div className="app" data-theme={theme}>
      <div className="app-inner">
        <DateDeckHeader
          view={view}
          theme={theme}
          onViewChange={setView}
          onThemeToggle={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
          onAddIdea={showAddIdeaForm}
          isAddIdeaOpen
          user={user}
          onAccount={() => setIsAccountOpen((open) => !open)}
          isAccountOpen={isAccountOpen}
        />

        <main className={view === 'deck' ? 'home home--deck' : 'home'}>
          {view !== 'liked' && (
            <FilterBar filters={filters} onChange={setFilters} counts={counts} />
          )}

          <section
            id="account-panel"
            ref={accountPanel}
            aria-label="Your DateDeck account"
            hidden={!isAccountOpen}
          >
            <AuthPanel onClose={() => setIsAccountOpen(false)} />
          </section>

          <Page filters={filters} signedIn={Boolean(user)} onSignIn={openAccount} />

          <section id="add-idea-panel" ref={addIdeaPanel} aria-label="Add a date idea">
            <AddIdeaForm signedIn={Boolean(user)} onSignIn={openAccount} />
          </section>
        </main>
      </div>
    </div>
  );
}
