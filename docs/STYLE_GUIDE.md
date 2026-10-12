# DateDeck style guide · DD-07

DateDeck uses a dark charcoal canvas, rounded panels, coral accents, and friendly rounded type. The supplied Deck and All ideas references define the layout. `frontend/src/styles/index.css` is the shared source of design tokens; `Home.jsx` owns the React header and layout. Both `index.html` and `datedeck.html` mount the same React app.

| Token family                                           | Use                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------- |
| `--page`, `--panel`, `--field`                         | Canvas, cards, and input backgrounds                                |
| `--ink`, `--muted`, `--line`                           | Primary text, secondary text, and borders                           |
| `--accent`, `--on-accent`                              | Coral highlights and their foreground                               |
| `--action`, `--on-action`, `--action-hover`            | Light action buttons and selected navigation                        |
| `--cozy` through `--night-out`, `--on-mood`            | Category pills and their foreground                                 |
| `--font-body`, `--text-*`, `--weight-*`, `--leading-*` | Fredoka with local fallbacks, type scale, weights, and line heights |
| `--space-1` through `--space-12`                       | Spacing scale from 4px to 64px                                      |
| `--radius-*`                                           | Small controls, panels, cards, deck corners, and pills              |
| `--control-*`, `--icon-*`                              | Consistent control and icon sizes                                   |
| `--art-*`, `--shadow-*`, `--focus`                     | Illustration palette, elevation, and keyboard focus                 |

**Layout.** Base styles target phones, including 320px and 375px. Below 640px, the browse grid is one column. From 640px it has two columns. At 800px, filters sit beside the content and the saved list follows below; navigation keeps its own header row. At 1280px, the header fits on one row and filters, results, and saved ideas form three columns. The 1700px breakpoint scales the reference layout for large screens. Use `minmax(0, 1fr)` and `min-width: 0` to let content shrink without sideways scrolling.

**React controls.** The Deck and Browse buttons use `aria-pressed`; Browse is labeled “All ideas” to match the reference. React chooses the view. The theme button sets `data-theme` on `.app`; CSS supplies the light palette. Add idea opens a labeled notice until DD-06 supplies the form. No component sets inline colors, fonts, or spacing.

**Accessibility.** Use real buttons and labels. Icon buttons need an accessible name; decorative SVGs use `aria-hidden`. Keep the visible focus ring and 44px minimum action targets. Reduced-motion preferences disable animations. Keep descriptions readable rather than clipping them. Check both palettes when changing tokens.

**Preview.** Run `npm run dev` from `frontend`, then open `/datedeck.html`. Click Deck, All ideas, the theme button, and Add idea. Inspect at 320px, 375px, 800px, 1280px, and the supplied screenshot sizes. The cards and counts are reference fixtures; filtering, saved lists, editing, deleting, and swiping are disabled pending their separate stories. They do not call PocketBase or persist data.

**Checks.** Run `npm run lint` and `npm run build`. The plan also requires `npm test`, but this checkout does not yet have a test script or Vitest/React Testing Library dependencies. That remains a test-setup gap, not a passed test suite. Browser verification is required before marking the layout's visual acceptance criterion complete.
