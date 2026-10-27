import IdeaCard from '../components/IdeaCard/IdeaCard.jsx';
import sampleIdeas from '../data/sample-ideas.json';

// Liked tab: shows the same grid as All ideas until DD-15 lists the saved ideas here.
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

  return (
    <section className="idea-grid" id="date-ideas" aria-label="Date ideas">
      {sampleIdeas.map((idea) => (
        <IdeaCard key={idea.id} idea={idea} />
      ))}
    </section>
  );
}
