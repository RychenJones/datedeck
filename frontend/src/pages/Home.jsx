import { useRef, useState } from 'react';
import AddIdeaForm from '../components/AddIdeaForm/AddIdeaForm.jsx';
import DateDeckHeader from '../components/DateDeckHeader/DateDeckHeader.jsx';
import IdeaCard from '../components/IdeaCard/IdeaCard.jsx';
import sampleIdeas from '../data/sample-ideas.json';

import '../styles/home.css';

// Main screen: the deck of ideas and the form to add one.
export default function Home() {
  const [view, setView] = useState('browse');
  const [theme, setTheme] = useState('dark');
  const addIdeaPanel = useRef(null);

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
        <main className="home">
          <section className="idea-grid" id="date-ideas" aria-label="Date ideas">
            {sampleIdeas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </section>

          <section id="add-idea-panel" ref={addIdeaPanel} aria-label="Add a date idea">
            <AddIdeaForm />
          </section>
        </main>
      </div>
    </div>
  );
}
