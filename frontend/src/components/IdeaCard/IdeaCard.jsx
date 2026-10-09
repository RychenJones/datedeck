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
export default function IdeaCard({ idea }) {
  const { title, place_name, location, price, duration, photo } = idea;

  return (
    <article className="idea-card">
      <div className="idea-card__photo-wrap">
        {photo ? (
          <img className="idea-card__photo" src={photo} alt={title} />
        ) : (
          <div className="idea-card__placeholder">No photo</div>
        )}
      </div>

      <div className="idea-card__content">
        <h2 className="idea-card__title">{title}</h2>
        <p className="idea-card__place">{place_name}</p>
        <p className="idea-card__area">{location}</p>

        <dl className="idea-card__details">
          <div>
            <dt>Price</dt>
            <dd>{formatPrice(price)}</dd>
          </div>
          <div>
            <dt>Duration</dt>
            <dd>{formatDuration(duration)}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
