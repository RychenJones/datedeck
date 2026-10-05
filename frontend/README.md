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
