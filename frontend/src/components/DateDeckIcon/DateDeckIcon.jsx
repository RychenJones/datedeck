/** Decorative icons; the button or link supplies the accessible name. */
export default function DateDeckIcon({ name, className = 'icon' }) {
  const paths = {
    heart:
      'M20.8 4.6a5.6 5.6 0 0 0-8.8 1 5.6 5.6 0 0 0-8.8-1C-.2 8.1 3 13.4 12 20.5c9-7.1 12.2-12.4 8.8-15.9Z',
    plus: 'M12 4v16M4 12h16',
    cards: 'M7 3H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h8',
    sun: 'M12 1v2m0 18v2M1 12h2m18 0h2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
    close: 'm5 5 14 14M19 5 5 19',
    user: 'M4 21a8 8 0 0 1 16 0',
    search: 'm15 15 6 6',
    undo: 'm8 4-5 5 5 5M3 9h11a6 6 0 0 1 0 12h-3',
    shuffle:
      'M3 5h3c5 0 7 14 12 14h3m-4-4 4 4-4 3M3 19h3c2 0 4-3 6-7m3-5c1-1 2-2 3-2h3m-4-3 4 3-4 4',
  };

  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {paths[name] && <path d={paths[name]} />}
      {name === 'sun' && <circle cx="12" cy="12" r="4" />}
      {name === 'search' && <circle cx="10" cy="10" r="7" />}
      {name === 'user' && <circle cx="12" cy="8" r="4" />}
      {name === 'cards' && (
        <rect x="6" y="3" width="13" height="18" rx="3" transform="rotate(8 12 12)" />
      )}
      {name === 'grid' && (
        <>
          <rect x="3" y="3" width="7" height="7" rx="2" />
          <rect x="14" y="3" width="7" height="7" rx="2" />
          <rect x="3" y="14" width="7" height="7" rx="2" />
          <rect x="14" y="14" width="7" height="7" rx="2" />
        </>
      )}
    </svg>
  );
}
