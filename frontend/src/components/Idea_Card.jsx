import '../styles/Idea_Card.css';

function formatPrice(price) {
  if (price === 0) return 'Free';
  return `$${price} per person`;
}

/**
 * A compact summary of one date idea.
 *
 * @param {{title: string, place: string, locationArea: string, pricePerPerson: number, duration: string, photo?: string}} idea
 */
export default function IdeaCard({ idea }) {
  const {
    title,
    place,
    locationArea,
    pricePerPerson,
    duration,
    photo,
  } = idea;

  return (
    <article className="idea-card">
      <div className="idea-card__photo-wrap">
        {photo ? (
          <img className="idea-card__photo" src={photo} alt="" />
        ) : (
          <div className="idea-card__placeholder" aria-label="No photo available">
            No photo
          </div>
        )}
      </div>

      <div className="idea-card__content">
        <h2 className="idea-card__title">{title}</h2>
        <p className="idea-card__place">{place}</p>
        <p className="idea-card__area">{locationArea}</p>

        <dl className="idea-card__details">
          <div>
            <dt>Price</dt>
            <dd>{formatPrice(pricePerPerson)}</dd>
          </div>
          <div>
            <dt>Duration</dt>
            <dd>{duration}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
