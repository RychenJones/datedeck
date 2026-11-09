import { useRef } from 'react';
import IdeaGridCard from '../components/IdeaGridCard/IdeaGridCard.jsx';
import AllIdeasButton from '../components/AllIdeasButton/AllIdeasButton.jsx';
import DoneList from '../components/DoneList/DoneList.jsx';
import IdeaListsLayout from '../components/IdeaListsLayout/IdeaListsLayout.jsx';
import { useSwipes } from '../hooks/useSwipes.js';

export default function Liked({ signedIn = false, onSignIn }) {
  const { saved, done, undoDone, lists } = useSwipes();
  const heading = useRef(null);
  // Liked shows the ideas left to try; ones you marked with We did this move to Done (DD-27).
  const toTry = saved.filter((id) => !done[id]);
  const ideas = lists.ideas.filter((idea) => toTry.includes(idea.id));
  const focusHeading = () => heading.current?.focus();

  return (
    <IdeaListsLayout showLists={false}>
      <section id="date-ideas" aria-label="Liked ideas">
        <h1 className="liked-heading" ref={heading} tabIndex={-1}>
          {toTry.length} liked ideas
        </h1>
        {saved.length === 0 ? (
          <div className="deck__empty" role="status">
            <h2>No liked ideas yet</h2>
            <p>
              Swipe right in the Deck or press Save in All Ideas to save ideas here. Press Remove to
              take one off your list.
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
            {lists.status === 'ready' && ideas.length < toTry.length && (
              <p role="status">Some saved ideas are no longer available.</p>
            )}
            {toTry.length === 0 ? (
              <div className="deck__empty" role="status">
                <h2>You did every idea you liked</h2>
                <p>Swipe right in the Deck or press Save in All Ideas to find your next date.</p>
                <AllIdeasButton />
              </div>
            ) : (
              <div className="idea-grid">
                {ideas.map((idea) => (
                  <IdeaGridCard
                    key={idea.id}
                    idea={idea}
                    onRemove={focusHeading}
                    onDone={focusHeading}
                  />
                ))}
              </div>
            )}
            <DoneList done={done} ideas={lists.ideas} onUndo={undoDone} />
          </>
        )}
      </section>
    </IdeaListsLayout>
  );
}
