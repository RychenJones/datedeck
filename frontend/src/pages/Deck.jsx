import { useEffect, useMemo } from 'react';
import IdeaCard from '../components/IdeaCard/IdeaCard.jsx';
import SwipeCard from '../components/SwipeCard/SwipeCard.jsx';
import { useIdeas } from '../hooks/useIdeas.js';
import { useSwipes } from '../hooks/useSwipes.js';

// Load the next page before the stack behind the top card runs out.
const LOW_STACK = 3;

function DeckMessage({ title, children }) {
  return (
    <div className="deck__empty" role="status">
      <span className="deck__empty-icon" aria-hidden="true">
        ♥
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}

// Deck tab: one idea at a time. Swipe the top card, use the arrow keys, or press Save and Hide.
export default function Deck({ filters }) {
  const { ideas, status, totalItems, hasMore, loadMore } = useIdeas(filters);
  const { saved, hidden, save, hide } = useSwipes();
  const remainingIdeas = useMemo(
    () => ideas.filter((idea) => !saved.includes(idea.id) && !hidden.includes(idea.id)),
    [ideas, saved, hidden],
  );
  const currentIdea = remainingIdeas[0];
  // Ideas on pages not loaded yet count as left too.
  const ideasLeft = remainingIdeas.length + Math.max(totalItems - ideas.length, 0);

  useEffect(() => {
    if (status === 'ready' && hasMore && remainingIdeas.length < LOW_STACK) loadMore();
  }, [status, hasMore, remainingIdeas.length, loadMore]);

  let content;
  if (status === 'loading') {
    content = <DeckMessage title="Loading ideas">Finding date ideas in Rexburg…</DeckMessage>;
  } else if (status === 'error' && !currentIdea) {
    content = (
      <DeckMessage title="Could not load ideas">
        Check your connection and reload the page to try again.
      </DeckMessage>
    );
  } else if (currentIdea) {
    content = (
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
          <SwipeCard
            key={currentIdea.id}
            onSave={() => save(currentIdea.id)}
            onHide={() => hide(currentIdea.id)}
          >
            <IdeaCard idea={currentIdea} />
          </SwipeCard>
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
            onClick={() => hide(currentIdea.id)}
            aria-label={`Hide ${currentIdea.title}`}
          >
            <span aria-hidden="true">×</span>
          </button>
          <button
            type="button"
            className="deck__control deck__control--save"
            onClick={() => save(currentIdea.id)}
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
    );
  } else if (hasMore || status === 'loading-more') {
    content = <DeckMessage title="Loading ideas">Getting more date ideas…</DeckMessage>;
  } else if (ideas.length === 0) {
    content = (
      <DeckMessage title="No ideas found">
        No date ideas match right now. Add one with the Add idea button.
      </DeckMessage>
    );
  } else {
    content = (
      <DeckMessage title="You are all caught up">
        There are no more ideas to choose from right now.
      </DeckMessage>
    );
  }

  return (
    <>
      <header className="home__header">
        <p className="home__eyebrow">DateDeck</p>
        <h1>Pick a date idea</h1>
        <p>Save what sounds fun. Hide what does not.</p>
      </header>

      <section className="deck" id="date-ideas" aria-label="Date idea deck">
        {status !== 'loading' && status !== 'error' && (
          <p className="deck__count" aria-live="polite">
            {ideasLeft} {ideasLeft === 1 ? 'idea' : 'ideas'} left
          </p>
        )}
        {content}
      </section>
    </>
  );
}
