import './IdeaCard.css';

function formatPrice(price) {
  if (price === 0) return 'Free';
  return `$${price} per person`;
}

// duration is stored in minutes, e.g. 90 -> "1 hr 30 min".
function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} hr`;
  return `${hours} hr ${rest} min`;
}

/**
 * A compact summary of one date idea. Uses the field names of the
 * PocketBase dates collection.
 *
 * @param {{title: string, place_name: string, location: string, price: number, duration: number, photo?: string}} idea
 */
export default function IdeaCard({ idea, onSave, onHide, isStacked = false }) {
  const { title, description, place_name, location, price, duration, category, photo } = idea;
  const priceLabel = formatPrice(price);
  const durationLabel = formatDuration(duration);

  return (
    <article className={`idea-card${isStacked ? ' idea-card--stacked' : ''}`}>
      <div className="idea-card__photo-wrap">
        {photo ? (
          <img className="idea-card__photo" src={photo} alt={title} />
        ) : (
          <div className="idea-card__placeholder" aria-label="Photo placeholder">
            <span aria-hidden="true">Photo coming soon</span>
            <span className="sr-only">No photo</span>
          </div>
        )}
      </div>

      <div className="idea-card__content">
        {category && <span className="idea-card__category">{category}</span>}
        <h2 className="idea-card__title">{title}</h2>
        <p className="idea-card__place">
          <span aria-hidden="true">⌖</span> {place_name}
        </p>
        <p className="idea-card__description">{description}</p>

        <dl className="idea-card__details">
          <div>
            <dt>How long</dt>
            <dd>{durationLabel}</dd>
          </div>
          <div>
            <dt>Per person</dt>
            <dd>{priceLabel}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{location}</dd>
          </div>
        </dl>

        {(onSave || onHide) && (
          <div className="idea-card__actions" aria-label="Choose what to do with this idea">
            <button
              type="button"
              className="idea-card__action idea-card__action--hide"
              onClick={onHide}
            >
              <span aria-hidden="true">×</span>
              <span className="sr-only">Hide {title}</span>
            </button>
            <button
              type="button"
              className="idea-card__action idea-card__action--save"
              onClick={onSave}
            >
              <span aria-hidden="true">♥</span>
              <span className="sr-only">Save {title}</span>
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
