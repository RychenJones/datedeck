import { useRef } from 'react';
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
  onSignOut,
}) {
  const accountButton = useRef(null);
  const isMenuOpen = Boolean(user) && isAccountOpen;
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
        <div
          className="account-menu"
          onBlur={(event) => {
            if (isMenuOpen && !event.currentTarget.contains(event.relatedTarget)) onAccount?.();
          }}
          onKeyDown={(event) => {
            if (isMenuOpen && event.key === 'Escape') onAccount?.();
          }}
        >
          <button
            ref={accountButton}
            className="account-button"
            type="button"
            aria-label={accountLabel}
            title={accountLabel}
            aria-controls={user ? undefined : 'account-panel'}
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
          {isMenuOpen && (
            <button
              className="account-menu__sign-out"
              type="button"
              onClick={() => {
                onSignOut?.();
                accountButton.current?.focus();
              }}
            >
              Sign out
            </button>
          )}
        </div>
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
