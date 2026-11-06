import { useRef } from 'react';
import IdeaGridCard from '../components/IdeaGridCard/IdeaGridCard.jsx';
import { useSwipeIdeas } from '../hooks/useSwipeIdeas.js';
import { useSwipes } from '../hooks/useSwipes.js';

const NO_HIDDEN_IDEAS = [];

function LikedMessage({ title, children }) {
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

function LikedIdeas() {
  const { saved } = useSwipes();
  const { ideas, status } = useSwipeIdeas(saved, NO_HIDDEN_IDEAS);
  const list = useRef(null);
  const likedIdeas = ideas.filter((idea) => saved.includes(idea.id));

  let content;
  if (saved.length === 0) {
    content = (
      <LikedMessage title="No liked ideas yet">
        Save an idea from the Deck or All ideas and it will show up here.
      </LikedMessage>
    );
  } else if (status === 'loading' && likedIdeas.length === 0) {
    content = <LikedMessage title="Loading your liked ideas">One moment…</LikedMessage>;
  } else if (likedIdeas.length === 0) {
    content =
      status === 'error' ? (
        <LikedMessage title="Could not load your liked ideas">
          Check your connection and reload the page to try again.
        </LikedMessage>
      ) : (
        <LikedMessage title="Your liked ideas are gone">
          The ideas you saved are no longer on DateDeck.
        </LikedMessage>
      );
  } else {
    content = (
      <>
        {status === 'error' && (
          <p className="idea-grid__more" role="alert">
            Could not load all of your liked ideas. Reload the page to try again.
          </p>
        )}
        <div className="idea-grid">
          {likedIdeas.map((idea) => (
            <IdeaGridCard key={idea.id} idea={idea} onRemove={() => list.current?.focus()} />
          ))}
        </div>
      </>
    );
  }

  return (
    <section id="date-ideas" aria-label="Date ideas" ref={list} tabIndex={-1}>
      {content}
    </section>
  );
}

// Liked tab: the ideas you saved, and a way to remove them.
// Saved ideas belong to an account, so signed-out people see none (DD-10).
export default function Liked({ signedIn = false, onSignIn }) {
  if (!signedIn) {
    return (
      <section id="date-ideas" aria-label="Date ideas">
        <div className="deck__empty" role="status">
          <span className="deck__empty-icon" aria-hidden="true">
            ♥
          </span>
          <h2>0 liked ideas</h2>
          <p>Sign in to be able to save your ideas.</p>
          <button className="home__empty-action" type="button" onClick={onSignIn}>
            Sign in
          </button>
        </div>
      </section>
    );
  }

  return <LikedIdeas />;
}
