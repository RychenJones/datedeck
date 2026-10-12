# DateDeck frontend

Vite + React app for DateDeck.

## Run it

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Start PocketBase first (see `../setup-pocketbase.md`) so the app can reach it at `VITE_POCKETBASE_URL`.

## Folders

- `src/components/` – reusable components, one folder per component
- `src/pages/` – screens
- `src/hooks/` – React hooks such as `useIdeas`
- `src/lib/` – shared clients (PocketBase)
- `src/styles/` – global styles and design tokens
- `src/data/` – sample data used before PocketBase is wired up

## Scripts

- `npm run dev` – start the dev server
- `npm run build` – build for production
- `npm run lint` – check code with ESLint
- `npm run format` – format code with Prettier

## Using `useIdeas`

Use the shared hook to load ideas and add a new one from a React component:

```jsx
import { useIdeas } from './hooks/useIdeas.js';

function IdeasList() {
  const { ideas, status, error, addIdea } = useIdeas();

  if (status === 'loading') return <p>Loading ideas...</p>;
  if (status === 'error') return <p>Could not load ideas: {error.message}</p>;

  async function handleAddIdea() {
    await addIdea({
      title: 'Bowling',
      description: 'A casual bowling date.',
      place_name: 'Rexburg Bowling Center',
      address: 'Rexburg, ID',
      location: 'Rexburg',
      price: 12,
      duration: 90,
      category: 'Activity',
    });
  }

  return (
    <>
      <button type="button" onClick={handleAddIdea}>
        Add example idea
      </button>
      {ideas.map((idea) => (
        <p key={idea.id}>{idea.title}</p>
      ))}
    </>
  );
}
```
