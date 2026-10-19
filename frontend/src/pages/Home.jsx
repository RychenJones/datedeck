import { useEffect, useMemo, useRef, useState } from 'react';
import AddIdeaForm from '../components/AddIdeaForm/AddIdeaForm.jsx';
import DateDeckHeader from '../components/DateDeckHeader/DateDeckHeader.jsx';
import IdeaCard from '../components/IdeaCard/IdeaCard.jsx';
import sampleIdeas from '../data/sample-ideas.json';

import '../styles/home.css';

const SWIPES_KEY = 'datedeck.swipes';

function readSwipes() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SWIPES_KEY));
    return {
      saved: Array.isArray(saved?.saved) ? saved.saved : [],
      hidden: Array.isArray(saved?.hidden) ? saved.hidden : [],
    };
  } catch {
    return { saved: [], hidden: [] };
  }
}

function writeSwipes(swipes) {
  window.localStorage.setItem(SWIPES_KEY, JSON.stringify(swipes));
}

// Main screen: the deck of ideas and the form to add one.
export default function Home() {
  const [view, setView] = useState('deck');
  const [theme, setTheme] = useState('dark');
  const addIdeaPanel = useRef(null);
  const [swipes, setSwipes] = useState(readSwipes);
  const remainingIdeas = useMemo(
    () =>
      sampleIdeas.filter(
        (idea) => !swipes.saved.includes(idea.id) && !swipes.hidden.includes(idea.id),
      ),
    [swipes],
  );
  const currentIdea = remainingIdeas[0];

  useEffect(() => {
    writeSwipes(swipes);
  }, [swipes]);

  function decide(decision) {
    if (!currentIdea) return;
    const nextSwipes = {
      ...swipes,
      [decision]: [...swipes[decision], currentIdea.id],
    };
    setSwipes(nextSwipes);
    writeSwipes(nextSwipes);
  }

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
          {view === 'deck' ? (
            <>
              <header className="home__header">
                <p className="home__eyebrow">DateDeck</p>
                <h1>Pick a date idea</h1>
                <p>Save what sounds fun. Hide what does not.</p>
              </header>

              <section className="deck" id="date-ideas" aria-label="Date idea deck">
                <p className="deck__count" aria-live="polite">
                  {remainingIdeas.length} {remainingIdeas.length === 1 ? 'idea' : 'ideas'} left
                </p>

                {currentIdea ? (
                  <div className="deck__stack">
                    {remainingIdeas.slice(1, 3).map((idea, index) => (
                      <div
                        className={`deck__behind deck__behind--${index + 1}`}
                        key={idea.id}
                        aria-hidden="true"
                      >
                        <IdeaCard idea={idea} isStacked />
                      </div>
                    ))}
                    <div className="deck__top">
                      <IdeaCard idea={currentIdea} />
                    </div>
                    <div className="deck__controls" aria-label="Deck controls">
                      <button
                        type="button"
                        className="deck__control deck__control--secondary"
                        disabled
                        aria-label="Undo last choice"
                      >
                        <span aria-hidden="true">↶</span>
                      </button>
                      <button
                        type="button"
                        className="deck__control deck__control--hide"
                        onClick={() => decide('hidden')}
                        aria-label={`Hide ${currentIdea.title}`}
                      >
                        <span aria-hidden="true">×</span>
                      </button>
                      <button
                        type="button"
                        className="deck__control deck__control--save"
                        onClick={() => decide('saved')}
                        aria-label={`Save ${currentIdea.title}`}
                      >
                        <span aria-hidden="true">♥</span>
                      </button>
                      <button
                        type="button"
                        className="deck__control deck__control--secondary"
                        disabled
                        aria-label="Shuffle ideas"
                      >
                        <span aria-hidden="true">⤨</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="deck__empty" role="status">
                    <span className="deck__empty-icon" aria-hidden="true">
                      ♥
                    </span>
                    <h2>You are all caught up</h2>
                    <p>There are no more ideas to choose from right now.</p>
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="idea-grid" id="date-ideas" aria-label="Date ideas">
              {sampleIdeas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </section>
          )}

          <section id="add-idea-panel" ref={addIdeaPanel} aria-label="Add a date idea">
            <AddIdeaForm />
          </section>
        </main>
      </div>
    </div>
  );
}
