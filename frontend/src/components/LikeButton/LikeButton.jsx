import { useSwipes } from '../../hooks/useSwipes.js';
import DateDeckIcon from '../DateDeckIcon/DateDeckIcon.jsx';
import './LikeButton.css';

export default function LikeButton({ idea, className = 'like-button', onToggle }) {
  const { saved, toggleSave } = useSwipes();
  return (
    <button
      type="button"
      className={`${className} like-toggle`}
      aria-label={`Save ${idea.title}`}
      aria-pressed={saved.includes(idea.id)}
      onClick={() => {
        toggleSave(idea.id);
        onToggle?.();
      }}
    >
      <DateDeckIcon name="heart" />
    </button>
  );
}
