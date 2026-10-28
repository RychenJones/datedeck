import { useEffect, useRef } from 'react';
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
  user = null,
  onAccount,
  isAccountOpen = false,
}) {
  const browseTab = useRef(null);
  useEffect(() => {
    function showAllIdeas() {
      onViewChange?.('browse');
      browseTab.current?.focus();
    }
    window.addEventListener('datedeck:show-all-ideas', showAllIdeas);
    return () => window.removeEventListener('datedeck:show-all-ideas', showAllIdeas);
  }, [onViewChange]);
  const userName = user && (user.name || user.email);
  const accountLabel = user ? `Signed in as ${userName}` : 'Sign in';

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
        <span className="brand-name">datedeck</span>
      </a>
      <nav className="view-tabs" aria-label="Date idea views">
        {views.map(({ value, label, icon }) => (
          <button
            className="tab"
            type="button"
            key={value}
            ref={value === 'browse' ? browseTab : undefined}
            aria-pressed={view === value}
            aria-controls="date-ideas"
            onClick={() => onViewChange?.(value)}
          >
            <DateDeckIcon name={icon} />
            <span className="tab-label">{label}</span>
          </button>
        ))}
      </nav>
      <div className="header-actions">
        <button
          className="theme-toggle"
          type="button"
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-pressed={theme === 'light'}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={onThemeToggle}
        >
          <DateDeckIcon name="sun" />
        </button>
        <button
          className="account-button"
          type="button"
          aria-label={accountLabel}
          title={accountLabel}
          aria-controls="account-panel"
          aria-expanded={isAccountOpen}
          onClick={onAccount}
        >
          {user ? (
            <span className="account-initial" aria-hidden="true">
              {userName.charAt(0).toUpperCase()}
            </span>
          ) : (
            <DateDeckIcon name="user" />
          )}
          <span className="account-label" aria-hidden="true">
            {user ? userName : 'Sign in'}
          </span>
        </button>
        <button
          className="button"
          type="button"
          aria-controls="add-idea-panel"
          aria-expanded={isAddIdeaOpen}
          onClick={onAddIdea}
        >
          <DateDeckIcon name="plus" />
          <span className="header-action-label">Add idea</span>
        </button>
      </div>
    </header>
  );
}
