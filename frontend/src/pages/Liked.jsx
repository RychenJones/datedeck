import { useRef } from 'react';
import IdeaCard from '../components/IdeaCard/IdeaCard.jsx';
import LikeButton from '../components/LikeButton/LikeButton.jsx';
import AllIdeasButton from '../components/AllIdeasButton/AllIdeasButton.jsx';
import IdeaListsLayout from '../components/IdeaListsLayout/IdeaListsLayout.jsx';
import { useSwipes } from '../hooks/useSwipes.js';

export default function Liked({ signedIn = false, onSignIn }) {
  const { saved, lists } = useSwipes();
  const heading = useRef(null);
  const ideas = lists.ideas.filter((idea) => saved.includes(idea.id));
  return (
    <IdeaListsLayout>
      <section id="date-ideas" aria-label="Liked ideas">
        <h1 className="liked-heading" ref={heading} tabIndex={-1}>
          {saved.length} liked ideas
        </h1>
        {saved.length === 0 ? (
          <div className="deck__empty" role="status">
            <h2>No liked ideas yet</h2>
            <p>
              Swipe right in the Deck or press a heart in All Ideas to save ideas here and in Saved
              for later. Press a selected heart again to unlike.
            </p>
            <AllIdeasButton />
            {!signedIn && onSignIn && (
              <>
                <p>You can also sign in to add your own ideas.</p>
                <button type="button" className="home__empty-action" onClick={onSignIn}>
                  Sign in
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {lists.status === 'loading' && <p role="status">Loading liked ideas…</p>}
            {lists.status === 'error' && (
              <p className="storage-message" role="alert">
                Could not load liked ideas. Check your connection and reload to try again.
              </p>
            )}
            {lists.status === 'ready' && ideas.length < saved.length && (
              <p role="status">
                Some saved ideas are no longer available. You can remove them in Saved for later.
              </p>
            )}
            <div className="idea-grid">
              {ideas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  actions={<LikeButton idea={idea} onToggle={() => heading.current?.focus()} />}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </IdeaListsLayout>
  );
}
