import { useSwipes } from '../../hooks/useSwipes.js';
import { mapsUrl } from '../../lib/mapsUrl.js';
import IdeaCard from '../IdeaCard/IdeaCard.jsx';

import './IdeaGridCard.css';

/** A card for the idea grids: all the details and every action, with nothing to open. */
export default function IdeaGridCard({ idea }) {
  const { saved, hidden, save, hide, unsave, unhide } = useSwipes();
  const { id, title, address } = idea;
  const isSaved = saved.includes(id);
  const isHidden = hidden.includes(id);

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
          <button
            type="button"
            className="idea-grid-card__choice idea-grid-card__choice--save"
            aria-pressed={isSaved}
            aria-label={`${isSaved ? 'Unsave' : 'Save'} ${title}`}
            onClick={() => (isSaved ? unsave(id) : save(id))}
          >
            {isSaved ? 'Unsave' : 'Save'}
          </button>
          <button
            type="button"
            className="idea-grid-card__choice"
            aria-pressed={isHidden}
            aria-label={`${isHidden ? 'Unhide' : 'Hide'} ${title}`}
            onClick={() => (isHidden ? unhide(id) : hide(id))}
          >
            {isHidden ? 'Unhide' : 'Hide'}
          </button>
        </div>
      }
    />
  );
}
