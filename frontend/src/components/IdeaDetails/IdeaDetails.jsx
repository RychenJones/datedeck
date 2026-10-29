import { useEffect, useRef, useState } from 'react';
import IdeaArt from '../IdeaArt/IdeaArt.jsx';
import './IdeaDetails.css';

function formatPrice(price) {
  if (price === 0) return 'Free';
  return `$${price} per person. `;
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} hr`;
  return `${hours} hr ${rest} min`;
}

function mapsUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export default function IdeaDetails({ idea, onClose }) {
  const closeButtonRef = useRef(null);
  const [failedPhoto, setFailedPhoto] = useState(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const { title, description, place_name, address, price, duration, category, photo } = idea;
  const photoSource =
    photo && !(failedPhoto?.ideaId === idea.id && failedPhoto.photo === photo) ? photo : null;

  return (
    <div className="idea-details__backdrop">
      <section
        className="idea-details"
        role="dialog"
        aria-modal="true"
        aria-labelledby="idea-details-title"
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="idea-details__close"
          onClick={onClose}
        >
          Close
        </button>

        <div className="idea-details__photo-wrap">
          {photoSource ? (
            <img
              className="idea-details__photo"
              src={photoSource}
              alt={title}
              onError={() => setFailedPhoto({ ideaId: idea.id, photo })}
            />
          ) : (
            <div className="idea-details__placeholder" aria-label="Photo placeholder">
              <IdeaArt category={category} />
              <span className="sr-only">No photo</span>
            </div>
          )}
        </div>

        <div className="idea-details__content">
          {category && <span className="idea-details__category">{category}</span>}
          <h2 id="idea-details-title">{title}</h2>
          <p className="idea-details__place">{place_name}</p>
          <p className="idea-details__description">{description}</p>

          <dl className="idea-details__facts">
            <div>
              <dt>Address</dt>
              <dd>{address || 'Address coming soon'}</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>{formatPrice(price)}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{formatDuration(duration)}</dd>
            </div>
          </dl>

          {address && (
            <a
              className="idea-details__maps"
              href={mapsUrl(address)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in Maps
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
