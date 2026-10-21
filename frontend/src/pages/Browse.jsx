import IdeaCard from '../components/IdeaCard/IdeaCard.jsx';
import sampleIdeas from '../data/sample-ideas.json';

// All ideas tab: every idea in a grid.
export default function Browse({ onOpenDetails }) {
  return (
    <section className="idea-grid" id="date-ideas" aria-label="Date ideas">
      {sampleIdeas.map((idea) => (
        <IdeaCard key={idea.id} idea={idea} onOpenDetails={onOpenDetails} />
      ))}
    </section>
  );
}
