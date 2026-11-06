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
            >
              Open in Maps
              <span className="sr-only"> for {title} (opens in a new tab)</span>
            </a>
          )}
          <button
            type="button"
            className="idea-grid-card__choice idea-grid-card__choice--save"
            aria-pressed={isSaved}
            onClick={() => (isSaved ? unsave(id) : save(id))}
          >
            {isSaved ? 'Unsave' : 'Save'}
            <span className="sr-only"> {title}</span>
          </button>
          <button
            type="button"
            className="idea-grid-card__choice"
            aria-pressed={isHidden}
            onClick={() => (isHidden ? unhide(id) : hide(id))}
          >
            {isHidden ? 'Unhide' : 'Hide'}
            <span className="sr-only"> {title}</span>
          </button>
        </div>
      }
    />
  );
}
