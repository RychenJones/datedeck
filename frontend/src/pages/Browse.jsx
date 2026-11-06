import IdeaGridCard from '../components/IdeaGridCard/IdeaGridCard.jsx';
import { useIdeas } from '../hooks/useIdeas.js';
import IdeaListsLayout from '../components/IdeaListsLayout/IdeaListsLayout.jsx';

function BrowseMessage({ title, children }) {
  return (
    <div className="empty-state" id="date-ideas" role="status">
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}

// All ideas tab: every idea in a grid, one page at a time.
function BrowseContent({ filters }) {
  const { ideas, status, hasMore, loadMore } = useIdeas(filters, { includeSamples: true });

  if (status === 'loading') {
    return <BrowseMessage title="Loading ideas">Finding date ideas in Rexburg…</BrowseMessage>;
  }
  if (status === 'error' && ideas.length === 0) {
    return (
      <BrowseMessage title="Could not load ideas">
        Check your connection and reload the page to try again.
      </BrowseMessage>
    );
  }
  if (ideas.length === 0) {
    return (
      <BrowseMessage title="No ideas found">
        No date ideas match right now. Add one with the Add idea button.
      </BrowseMessage>
    );
  }

  return (
    <>
      <section className="idea-grid" id="date-ideas" aria-label="Date ideas">
        {ideas.map((idea) => (
          <IdeaGridCard key={idea.id} idea={idea} />
        ))}
      </section>
      {status === 'error' && (
        <p className="idea-grid__more" role="alert">
          Could not load more ideas. Reload the page to try again.
        </p>
      )}
      {hasMore && status !== 'error' && (
        <p className="idea-grid__more">
          <button
            type="button"
            className="button"
            onClick={loadMore}
            disabled={status === 'loading-more'}
          >
            {status === 'loading-more' ? 'Loading…' : 'Show more ideas'}
          </button>
        </p>
      )}
    </>
  );
}

export default function Browse(props) {
  return (
    <IdeaListsLayout>
      <BrowseContent {...props} />
    </IdeaListsLayout>
  );
}
