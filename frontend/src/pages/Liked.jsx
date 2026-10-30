import { useState } from 'react';
import IdeaCard from '../components/IdeaCard/IdeaCard.jsx';
import sampleIdeas from '../data/sample-ideas.json';
import IdeaDetails from '../components/IdeaDetails/IdeaDetails.jsx';

export default function Liked({ signedIn = false, onSignIn }) {
  const [selectedIdea, setSelectedIdea] = useState(null);

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
    <>
      <section className="idea-grid" id="date-ideas" aria-label="Date ideas">
        {sampleIdeas.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} onOpenDetails={setSelectedIdea} />
        ))}
      </section>
      {selectedIdea && <IdeaDetails idea={selectedIdea} onClose={() => setSelectedIdea(null)} />}
    </>
  );
}
