import { useSwipes } from '../../hooks/useSwipes.js';
import { mapsUrl } from '../../lib/mapsUrl.js';
import IdeaCard from '../IdeaCard/IdeaCard.jsx';

import './IdeaGridCard.css';

/**
 * A card for the idea grids: all the details, with nothing to open. All ideas saves an idea, and
 * Liked removes one, passing `onRemove` to move focus once the card is gone. Hiding is for the deck.
 */
export default function IdeaGridCard({ idea, onRemove }) {
  const { saved, save, unsave } = useSwipes();
  const { id, title, address } = idea;
  const isSaved = saved.includes(id);

  return (
    <IdeaCard
      idea={idea}
      showAddress
      actions={
        <div className="idea-grid-card__actions" aria-label={`Actions for ${title}`}>
          {address && (
            <a
              className="idea-grid-card__maps"
              href={mapsUrl(address)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open in Maps for ${title} (opens in a new tab)`}
            >
              Open in Maps
            </a>
          )}
          {onRemove ? (
            <button
              type="button"
              className="idea-grid-card__choice"
              aria-label={`Remove ${title} from liked ideas`}
              onClick={() => {
                unsave(id);
                onRemove();
              }}
            >
              Remove
            </button>
          ) : (
            <button
              type="button"
              className="idea-grid-card__choice idea-grid-card__choice--save"
              aria-pressed={isSaved}
              aria-label={`${isSaved ? 'Unsave' : 'Save'} ${title}`}
              onClick={() => (isSaved ? unsave(id) : save(id))}
            >
              {isSaved ? 'Unsave' : 'Save'}
            </button>
          )}
        </div>
      }
    />
  );
}
