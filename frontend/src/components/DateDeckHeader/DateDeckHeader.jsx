import DateDeckIcon from '../DateDeckIcon/DateDeckIcon.jsx';
import './DateDeckHeader.css';

/** Controlled header: Home owns navigation, theme, and form state. */
export default function DateDeckHeader({
  view = 'deck',
  theme = 'dark',
  onViewChange,
  onThemeToggle,
  onAddIdea,
  isAddIdeaOpen = false,
}) {
  const views = [
    { value: 'deck', label: 'Deck', icon: 'cards' },
    { value: 'browse', label: 'All ideas', icon: 'grid' },
    { value: 'liked', label: 'Liked', icon: 'heart' },
  ];

  return (
    <header className="topbar datedeck-header">
      <a className="brand" href="/" aria-label="DateDeck home">
        <span className="brand-mark">
          <DateDeckIcon name="heart" />
        </span>
        datedeck
      </a>
      <nav className="view-tabs" aria-label="Date idea views">
        {views.map(({ value, label, icon }) => (
          <button
            className="tab"
            type="button"
            key={value}
            aria-pressed={view === value}
            aria-controls="date-ideas"
            onClick={() => onViewChange?.(value)}
          >
            <DateDeckIcon name={icon} />
            {label}
          </button>
        ))}
      </nav>
      <div className="header-actions">
        <button
          className="theme-toggle"
          type="button"
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-pressed={theme === 'light'}
          onClick={onThemeToggle}
        >
          <DateDeckIcon name="sun" />
        </button>
        <button
          className="button"
          type="button"
          aria-controls="add-idea-panel"
          aria-expanded={isAddIdeaOpen}
          onClick={onAddIdea}
        >
          <DateDeckIcon name="plus" />
          Add idea
        </button>
      </div>
    </header>
  );
}
