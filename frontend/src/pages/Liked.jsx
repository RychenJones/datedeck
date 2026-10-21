import IdeaCard from '../components/IdeaCard/IdeaCard.jsx';
import sampleIdeas from '../data/sample-ideas.json';

// Liked tab: shows the same grid as All ideas until DD-15 lists the saved ideas here.
export default function Liked() {
  return (
    <section className="idea-grid" id="date-ideas" aria-label="Date ideas">
      {sampleIdeas.map((idea) => (
        <IdeaCard key={idea.id} idea={idea} />
      ))}
    </section>
  );
}
