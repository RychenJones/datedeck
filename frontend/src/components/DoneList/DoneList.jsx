import { useRef } from 'react';
import IdeaArt from '../IdeaArt/IdeaArt.jsx';
import '../IdeaListsLayout/IdeaListsLayout.css';
import './DoneList.css';

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

/** "Nov 8, 2026" in the person's own time zone. */
function formatDoneDate(isoDate) {
  return dateFormat.format(new Date(isoDate));
}

/**
 * The Done section under Liked (DD-27): saved ideas you marked with We did this, newest first,
 * each with the date you marked it and an Undo that puts it back with the ideas left to try.
 *
 * @param {{ done: Record<string, string>, ideas: object[], onUndo: (id: string) => void }} props
 */
export default function DoneList({ done, ideas, onUndo }) {
  const heading = useRef(null);
  const ids = Object.keys(done).sort((a, b) => Date.parse(done[b]) - Date.parse(done[a]));

  return (
    <section className="choice-list done-list" aria-labelledby="done-list-heading">
      <h2 id="done-list-heading" ref={heading} tabIndex={-1}>
        Done <span className="choice-list__count">{ids.length}</span>
      </h2>
      {ids.length === 0 ? (
        <p className="done-list__empty">
          Went on one of your liked dates? Press We did this on it to keep a record here.
        </p>
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
                  <p>
                    Done <time dateTime={done[id]}>{formatDoneDate(done[id])}</time>
                  </p>
                </div>
                <button
                  type="button"
                  className="choice-list__action"
                  aria-label={`Undo done for ${name}`}
                  onClick={() => {
                    onUndo(id);
                    heading.current?.focus();
                  }}
                >
                  Undo
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
