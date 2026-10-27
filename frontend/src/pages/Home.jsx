import { useRef, useState } from 'react';
import AddIdeaForm from '../components/AddIdeaForm/AddIdeaForm.jsx';
import DateDeckHeader from '../components/DateDeckHeader/DateDeckHeader.jsx';
import FilterBar from '../components/FilterBar/FilterBar.jsx';
import { NO_FILTERS, useIdeaCounts } from '../hooks/useIdeas.js';
import Browse from './Browse.jsx';
import Deck from './Deck.jsx';
import Liked from './Liked.jsx';

import '../styles/home.css';

const PAGES = { deck: Deck, browse: Browse, liked: Liked };

// Main screen: the header, the tab you picked and the form to add an idea.
export default function Home() {
  const [view, setView] = useState('deck');
  const [theme, setTheme] = useState('dark');
  // Shared by the deck and All ideas so both views respond to the same filters.
  const [filters, setFilters] = useState(NO_FILTERS);
  const counts = useIdeaCounts(filters);
  const addIdeaPanel = useRef(null);
  const Page = PAGES[view];

  function showAddIdeaForm() {
    addIdeaPanel.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
    addIdeaPanel.current?.querySelector('input')?.focus({ preventScroll: true });
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
        />
        <main className={view === 'deck' ? 'home home--deck' : 'home'}>
          {view !== 'liked' && (
            <FilterBar filters={filters} onChange={setFilters} counts={counts} />
          )}
          <Page filters={filters} />

          <section id="add-idea-panel" ref={addIdeaPanel} aria-label="Add a date idea">
            <AddIdeaForm />
          </section>
        </main>
      </div>
    </div>
  );
}
