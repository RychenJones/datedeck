import IdeaCard from '../components/Idea_Card.jsx';
import sampleIdeas from '../data/sample-ideas.json';

import '../styles/home.css';

// Main screen: the deck of ideas and the form to add one.
export default function Home() {
  return (
    <main className="home">
      <header className="home__header">
        <p className="home__eyebrow">DateDeck</p>
        <h1>Pick an idea</h1>
        <p>Browse the details at a glance and choose your next date.</p>
      </header>

      <section className="idea-grid" aria-label="Date ideas">
        {sampleIdeas.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} />
        ))}
      </section>
    </main>
  );
}
