import { CloudOff, RefreshCw, WifiOff } from 'lucide-react';
import './ConnectionError.css';

// The PocketBase SDK reports a request that never reached the server with status 0.
function isUnreachable(error) {
  return error?.status === 0;
}

/**
 * Friendly screen for when ideas cannot load (DD-28). It says whether DateDeck could not be
 * reached at all or the server had a problem, and offers Try again plus any extra actions.
 */
export default function ConnectionError({ error, onRetry, retryRef, children }) {
  const unreachable = isUnreachable(error);
  const Icon = unreachable ? WifiOff : CloudOff;

  return (
    <div className="deck__empty" role="alert">
      <span className="deck__empty-icon" aria-hidden="true">
        <Icon />
      </span>
      <h2>{unreachable ? 'We can’t reach DateDeck right now' : 'Could not load ideas'}</h2>
      <p>
        {unreachable
          ? 'Check your internet connection, then try again. Your liked and hidden ideas are safe on this device.'
          : 'Something went wrong on our side. Wait a moment, then try again.'}
      </p>
      <div className="connection-error__actions">
        <button type="button" className="home__empty-action" ref={retryRef} onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          Try again
        </button>
        {children}
      </div>
    </div>
  );
}
