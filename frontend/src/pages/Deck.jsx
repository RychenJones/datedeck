import { useEffect, useMemo, useRef } from 'react';
import { Heart, Shuffle, Undo2, X } from 'lucide-react';
import IdeaCard from '../components/IdeaCard/IdeaCard.jsx';
import SwipeCard from '../components/SwipeCard/SwipeCard.jsx';
import { useIdeas } from '../hooks/useIdeas.js';
import { useSwipes } from '../hooks/useSwipes.js';
import LikeButton from '../components/LikeButton/LikeButton.jsx';
import IdeaListsLayout from '../components/IdeaListsLayout/IdeaListsLayout.jsx';
import AllIdeasButton from '../components/AllIdeasButton/AllIdeasButton.jsx';

// Load the next page before the stack behind the top card runs out.
const LOW_STACK = 3;

// Ideas named in the deck order come first; anything else (like a page loaded later) follows.
function inDeckOrder(ideas, deckOrder) {
  const byId = new Map(ideas.map((idea) => [idea.id, idea]));
  const placed = new Set(deckOrder);
  return [
    ...deckOrder.filter((id) => byId.has(id)).map((id) => byId.get(id)),
    ...ideas.filter((idea) => !placed.has(idea.id)),
  ];
}

function DeckMessage({ title, action, children }) {
  return (
    <div className="deck__empty" role="status">
      <span className="deck__empty-icon" aria-hidden="true">
        ♥
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}

// Deck tab: one idea at a time. Swipe the top card, use the arrow keys, or press Save and Hide.
// Undo takes back the last choice and Shuffle mixes up the ideas that are left.
export default function Deck({ filters }) {
  // Database ideas when there are some; the sample ideas until the database has any.
  const { ideas, status, totalItems, hasMore, loadMore } = useIdeas(filters, {
    samplesWhenEmpty: true,
  });
  const { saved, hidden, canUndo, deckOrder, save, hide, undo, unhideAll, shuffle } = useSwipes();
  const remainingIdeas = useMemo(
    () =>
      inDeckOrder(ideas, deckOrder).filter(
        (idea) => !saved.includes(idea.id) && !hidden.includes(idea.id),
      ),
    [ideas, deckOrder, saved, hidden],
  );
  const currentIdea = remainingIdeas[0];
  // Ideas on pages not loaded yet count as left too.
  const ideasLeft = remainingIdeas.length + Math.max(totalItems - ideas.length, 0);

  // A shuffle mixes every idea that is left, so it waits until all the pages have loaded.
  const shuffleWanted = useRef(false);

  function loadOrShuffle() {
    if (status === 'ready' && hasMore) {
      if (shuffleWanted.current || remainingIdeas.length < LOW_STACK) loadMore();
    } else if (shuffleWanted.current && (status === 'ready' || status === 'error')) {
      shuffleWanted.current = false;
      shuffle(remainingIdeas.map((idea) => idea.id));
    }
  }

  useEffect(() => {
    loadOrShuffle();
  });

  // Undo on an empty deck can swap that screen for the cards, so keep keyboard focus on Undo,
  // or on the deck itself when no Undo button is left.
  const deck = useRef(null);
  const undoButton = useRef(null);
  const refocusUndo = useRef(false);
  useEffect(() => {
    if (refocusUndo.current) (undoButton.current ?? deck.current)?.focus();
    refocusUndo.current = false;
  });

  const undoAction = canUndo && (
    <button
      type="button"
      className="home__empty-action"
      ref={undoButton}
      onClick={() => {
        refocusUndo.current = true;
        undo();
      }}
    >
      Undo last choice
    </button>
  );

  let content;
  if (status === 'loading') {
    content = <DeckMessage title="Loading ideas">Finding date ideas in Rexburg…</DeckMessage>;
  } else if (status === 'error' && !currentIdea) {
    content = (
      <DeckMessage title="Could not load ideas" action={undoAction}>
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
            ref={undoButton}
            disabled={!canUndo}
            onClick={undo}
            aria-label="Undo last choice"
          >
            <Undo2 aria-hidden="true" />
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
            <X aria-hidden="true" />
          </button>
          <LikeButton
            idea={currentIdea}
            className="deck__control deck__control--save"
            onClick={() => save(currentIdea.id)}
            aria-label={`Save ${currentIdea.title}`}
          >
            <Heart aria-hidden="true" />
          </button>
          <button
            type="button"
            className="deck__control deck__control--secondary deck__control--shuffle"
            disabled={ideasLeft < 2}
            onClick={() => {
              shuffleWanted.current = true;
              loadOrShuffle();
            }}
            aria-label="Shuffle ideas"
          >
            <Shuffle aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  } else if (hasMore || status === 'loading-more') {
    content = <DeckMessage title="Loading ideas">Getting more date ideas…</DeckMessage>;
  } else if (ideas.length === 0) {
    content = (
      <DeckMessage title="No ideas found" action={undoAction}>
        No date ideas match right now. Add one with the Add idea button.
      </DeckMessage>
    );
  } else {
    content = (
      <DeckMessage
        title="You are all caught up"
        action={
          <>
            {undoAction}
            {ideas.some((idea) => hidden.includes(idea.id) && !saved.includes(idea.id)) && (
              <button
                type="button"
                className="home__empty-action"
                onClick={() => {
                  unhideAll();
                  deck.current?.focus();
                }}
              >
                Bring back hidden ideas
              </button>
            )}
          </>
        }
      >
        There are no more ideas to choose from right now.
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

      <section
        className="deck"
        id="date-ideas"
        aria-label="Date idea deck"
        ref={deck}
        tabIndex={-1}
      >
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
