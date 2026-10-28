import { useRef } from 'react';
import IdeaArt from '../IdeaArt/IdeaArt.jsx';
import AllIdeasButton from '../AllIdeasButton/AllIdeasButton.jsx';

export default function ChoiceList({ ids, title, action, onAction, ideas, status }) {
  const heading = useRef(null);
  return (
    <section className="choice-list" aria-label={title}>
      <h2 ref={heading} tabIndex={-1}>
        {title} <span className="choice-list__count">{ids.length}</span>
      </h2>
      {status === 'loading' && ids.length > 0 && <p role="status">Loading your ideas…</p>}
      {status === 'error' && ids.length > 0 && (
        <p role="alert">
          Could not load your ideas. Check your connection and reload to try again.
        </p>
      )}
      {ids.length === 0 ? (
        <div className="saved-empty">
          <p>
            {action === 'Unlike'
              ? 'Swipe right or use a heart to save ideas here and in Liked.'
              : 'Swipe left or choose Hide to set an idea aside. Bring back returns it to the deck.'}
          </p>
          <AllIdeasButton />
        </div>
      ) : (
        <ul className="choice-list__items">
          {ids.map((id) => {
            const idea = ideas.find((item) => item.id === id);
            const name = idea?.title || 'Unavailable idea';
            return (
              <li className="choice-list__item" key={id}>
                <div className="choice-list__photo" aria-hidden="true">
                  {idea?.photo ? (
                    <img src={idea.photo} alt="" />
                  ) : (
                    <IdeaArt category={idea?.category} />
                  )}
                </div>
                <div className="choice-list__copy">
                  <p>{name}</p>
                  {idea && (
                    <p>
                      {idea.location} · {idea.price === 0 ? 'Free' : `$${idea.price} per person`}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="choice-list__action"
                  aria-label={`${action} ${name}`}
                  onClick={() => {
                    onAction(id);
                    heading.current?.focus();
                  }}
                >
                  {action}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
