import { useEffect, useMemo, useRef } from 'react';
import IdeaCard from '../components/IdeaCard/IdeaCard.jsx';
import SwipeCard from '../components/SwipeCard/SwipeCard.jsx';
import { useIdeas } from '../hooks/useIdeas.js';
import { useSwipes } from '../hooks/useSwipes.js';
import LikeButton from '../components/LikeButton/LikeButton.jsx';
import IdeaListsLayout from '../components/IdeaListsLayout/IdeaListsLayout.jsx';
import AllIdeasButton from '../components/AllIdeasButton/AllIdeasButton.jsx';

// Load the next page before the stack behind the top card runs out.
const LOW_STACK = 3;

function DeckMessage({ title, children, browse = false }) {
  return (
    <div className="deck__empty" role="status">
      <span className="deck__empty-icon" aria-hidden="true">
        ♥
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
      {browse && <AllIdeasButton />}
    </div>
  );
}

// Deck tab: one idea at a time. Swipe the top card, use the arrow keys, or press Save and Hide.
function DeckContent({ filters }) {
  const { ideas, status, totalItems, hasMore, loadMore } = useIdeas(filters);
  const { saved, hidden, save, hide } = useSwipes();
  const heading = useRef(null);
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
            onClick={() => {
              hide(currentIdea.id);
              if (remainingIdeas.length === 1) heading.current?.focus();
            }}
            aria-label={`Hide ${currentIdea.title}`}
          >
            <span aria-hidden="true">×</span>
          </button>
          <LikeButton
            idea={currentIdea}
            className="deck__control deck__control--save"
            onToggle={() => {
              if (remainingIdeas.length === 1) heading.current?.focus();
            }}
          />
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
      <DeckMessage title="No ideas found" browse>
        No date ideas match right now. Try All Ideas and use hearts to save favorites, or add one
        with the Add idea button.
      </DeckMessage>
    );
  } else {
    content = (
      <DeckMessage title="You are all caught up" browse>
        Swipe right or use hearts to save ideas, and swipe left to hide them. Visit All Ideas to
        like again, or use Bring back in Hidden ideas to return an idea to the deck.
      </DeckMessage>
    );
  }

  return (
    <>
      <header className="home__header">
        <p className="home__eyebrow">DateDeck</p>
        <h1 ref={heading} tabIndex={-1}>
          Pick a date idea
        </h1>
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

export default function Deck(props) {
  return (
    <IdeaListsLayout>
      <DeckContent {...props} />
    </IdeaListsLayout>
  );
}
