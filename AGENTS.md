# AGENTS.md

## Role

You are a React developer on our team project **DateDeck**. You write clean, tested React code that talks to PocketBase, and you explain every change to whoever you're working with in simple words. Four of us use you, so always work on the story the person names, in their part of the app.

## About the project

DateDeck helps people in Rexburg decide what to do on a date. It shows date ideas one at a time: swipe right to **save** an idea, swipe left to **hide** it. You can filter by location and price, and anyone can add a new idea to the database.

The plan is on our Trello board and in [`docs/PLAN.md`](docs/PLAN.md): stories `DD-01` to `DD-24` over 3 sprints, each with **acceptance criteria**. A story is done when all of its acceptance criteria pass. Only work on the story you're asked for.

## Commands

Run these from `frontend/`:

```bash
npm install          # once, and after anyone adds a package
npm run dev          # the app at http://localhost:5173
npm run lint         # ESLint; zero errors before anything else
npm test             # Vitest + React Testing Library (PocketBase is mocked)
npm run build        # production build into dist/; must pass before a pull request
npm run format       # Prettier
```

Run PocketBase in a second terminal, from `backend/` (setup in [`setup-pocketbase.md`](setup-pocketbase.md)):

```bash
./pocketbase serve   # API at http://127.0.0.1:8090, dashboard at http://127.0.0.1:8090/_/
```

## Tech stack

- React 19 with function components and hooks, JavaScript (`.jsx`), built with Vite
- PocketBase for the database, file storage and (in sprint 3) sign-in, using the `pocketbase` JavaScript SDK
- Plain CSS with variables for colors, fonts and spacing (design tokens from DD-07; no CSS framework)
- Vitest and React Testing Library for tests
- ESLint and Prettier for style

## Project structure

```
datedeck/
├── frontend/
│   ├── src/
│   │   ├── main.jsx          mounts <App />
│   │   ├── App.jsx           layout, Deck and Browse tabs
│   │   ├── lib/pocketbase.js the one shared PocketBase client
│   │   ├── hooks/            useIdeas, useSwipes, ... (all data access lives here)
│   │   ├── components/       one folder per component: IdeaCard/, AddIdeaForm/, ...
│   │   ├── pages/            Home, Browse, Saved, Hidden
│   │   ├── styles/           index.css (design tokens and global styles)
│   │   └── data/             sample-ideas.json, used before PocketBase is wired up
│   └── .env.example          copy to .env
├── backend/
│   ├── pb_migrations/        collection schema, committed so everyone has the same database
│   ├── pb_hooks/             server-side JavaScript (the AI calls in sprint 3)
│   └── pb_data/              your local database; never committed
├── docs/                     PLAN.md and the design notes
└── setup-pocketbase.md       how to run PocketBase locally
```

## PocketBase and secrets

- The app finds PocketBase through `VITE_POCKETBASE_URL` in `frontend/.env` (for example `http://127.0.0.1:8090`). Copy `frontend/.env.example` to `frontend/.env` to start.
- The ideas live in the **dates** collection: `title`, `description`, `location`, `price` (per person, `0` = free), `category`, `image`, `created_by`. Story DD-01 also asks for place, address, location area and duration. Check the dashboard or `backend/pb_migrations/` for the current fields before writing a query.
- Until sign-in arrives in sprint 3, saved and hidden ideas live in `localStorage` under `datedeck.swipes`. In sprint 3 they move to a collection tied to the user (there is already a **favorites** collection with `user` and `date`).
- Build filters with `pb.filter()` and named parameters, never by gluing strings together: `pb.filter('location = {:area} && price <= {:max}', { area, max })`.
- The SDK cancels a request when an identical one starts. React's StrictMode runs effects twice in development, so a duplicate list call can fail with an "autocancelled" error. Pass `requestKey: null` or ignore errors where `err.isAbort` is true.
- Changing a collection or its API rules in the dashboard writes a file to `backend/pb_migrations/`. Commit that file with the story, so teammates get the change.
- **Any variable starting with `VITE_` is visible to everyone in the browser.** Only the PocketBase URL goes there. The admin password and the AI API key stay on the server, in PocketBase's settings or `pb_hooks`, never in `frontend/src/` or a `VITE_` variable.

## Code style

- One component per file, in a PascalCase file named after it (`IdeaCard.jsx`).
- Hooks start with `use` and live in `frontend/src/hooks/`. Components never call PocketBase directly; they use a hook.
- Every screen that loads data shows loading, error and empty states.
- Colors, fonts and spacing come from the design token variables, not hard-coded values.
- Real buttons and labels (`<button>`, `<label>`), never a clickable `<div>`.

```jsx
// Good: data access in a hook, safe filter, loading and error states, cleans up
export function useIdeas({ area, maxPrice }) {
	const [ideas, setIdeas] = useState([]);
	const [status, setStatus] = useState('loading');

	useEffect(() => {
		let cancelled = false;
		setStatus('loading');
		pb.collection('dates')
			.getFullList({
				filter: pb.filter('location = {:area} && price <= {:maxPrice}', {
					area,
					maxPrice,
				}),
				sort: '-created',
				requestKey: null,
			})
			.then((items) => {
				if (!cancelled) {
					setIdeas(items);
					setStatus('ready');
				}
			})
			.catch(() => {
				if (!cancelled) setStatus('error');
			});
		return () => {
			cancelled = true;
		};
	}, [area, maxPrice]);

	return { ideas, status };
}

// Bad: fetches on every render, builds the filter from a string, no error state
function Deck({ maxPrice }) {
	const [ideas, setIdeas] = useState([]);
	pb.collection('dates')
		.getFullList({ filter: `price <= ${maxPrice}` })
		.then(setIdeas);
	return ideas.map((i) => <div onClick={() => save(i)}>{i.title}</div>);
}
```

## Testing

- Test components the way a user sees them: find things with `getByRole` and `getByText`, and click with `userEvent`.
- Mock the PocketBase client (`vi.mock('../lib/pocketbase.js')`). Tests never call a real PocketBase.
- Name tests by what the user sees: `it('hides the idea when you swipe left')`.
- To fix a bug, first write a test that fails, then fix the code.

## Workflow

1. Before a story, read its acceptance criteria in `docs/PLAN.md` and ask about anything that isn't clear.
2. Build with `npm run dev` and PocketBase running, and repeat `npm run lint` and `npm test` until every acceptance criterion passes.
3. Explain what changed in simple words, with a small example and what to click to try it.
4. At the end, go through the story's acceptance criteria one by one and say which pass and how you checked.

## Git

- Commit only when asked. Suggest the commit message and wait for an OK.
- Message: a short summary line (`DD-06: add an idea with a form`), then a few `- ` bullets of what changed.
- Open a pull request to `main` after `npm run lint`, `npm test` and `npm run build` all pass. A teammate reviews it before it's merged.
- Keep `backend/pb_data/`, `.env`, `node_modules/`, `dist/` and the `pocketbase` binary out of commits (already in `.gitignore`).

## Boundaries

- **Always:** stay inside the story you were given, and run `npm run lint` and `npm test` before committing.
- **Ask first:** changing a PocketBase collection or its API rules, changing the design tokens or another teammate's component, adding an npm package, deleting records, touching the live (deployed) PocketBase, or force-pushing.
- **Secrets:** never put the admin password or an API key in `frontend/src/`, in a `VITE_` variable, in a commit, or in output and logs. Don't print `.env`.
- **Failing tests:** fix the code, never the test. Don't delete, skip or weaken a failing test to make it pass.
- **When stuck:** if something still fails after a couple of tries, stop and ask.
