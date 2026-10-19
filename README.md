# DateDeck

DateDeck is a full-stack application designed to improve the dating scene in Rexburg, ID. With students going on frequent dates, coming up with new and interesting ideas can become difficult, often leading to repetitive dates or simply "hanging out." DateDeck addresses this problem by providing an extensive database of date ideas in and around Rexburg that can be filtered by factors such as location and price to help users plan the perfect date night.

DateDeck shows date ideas one at a time, like a deck of cards: swipe right to **save** an idea, swipe left to **hide** it. The DateDeck database is continuously expanding, allowing users to submit their own date ideas and contribute new recommendations to the community.

# Team Members

- Rychen Jones
- Riley Cluff
- Gabriel Wargha
- Talmage Trebilcock

# Instructions

You need [Node.js](https://nodejs.org/) and the PocketBase binary (see [`setup-pocketbase.md`](setup-pocketbase.md)).

1. Start PocketBase in one terminal:

   ```bash
   cd backend
   ./pocketbase serve   # API at http://127.0.0.1:8090, dashboard at http://127.0.0.1:8090/_/
   ```

2. Start the React app in a second terminal:

   ```bash
   cd frontend
   npm install
   cp .env.example .env   # sets VITE_POCKETBASE_URL
   npm run dev            # http://localhost:5173
   ```

Other commands (from `frontend/`): `npm run lint`, `npm test`, `npm run build`, `npm run format`.

# Branches and Pull Requests

- `main` is protected: nobody pushes to it directly, and every change goes in through a pull request.
- Make one branch per story from the latest `main`, named `yourname/dd-XX` (for example `gabriel/dd-06`).
- Before opening a pull request, run `npm run lint`, `npm test`, `npm run build` and `npm run format` in `frontend/`; all of them must pass.
- Commit messages start with the story: `DD-06: add an idea with a form`, followed by a few `- ` bullets of what changed.
- A teammate reviews and approves every pull request before it is merged. Never force-push to `main`.
- Stage files by name instead of `git add .`, and keep `.env`, `backend/pb_data/` and other database copies out of commits.

# Architecture

| Layer             | Choice                                                                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Language          | JavaScript (`.jsx`), HTML, CSS                                                                                                               |
| Frontend          | React 19 (function components and hooks), built with Vite                                                                                    |
| Styling           | Plain CSS with design-token variables (see [`docs/STYLE_GUIDE.md`](docs/STYLE_GUIDE.md)); no CSS framework                                   |
| Backend           | PocketBase (REST API, file storage, and sign-in in sprint 3), using the `pocketbase` JavaScript SDK                                          |
| Data storage      | PocketBase SQLite database: `dates` collection for ideas, `favorites` and `users` for accounts; schema committed in `backend/pb_migrations/` |
| Browser storage   | `localStorage` (`datedeck.swipes`) for saved and hidden ideas until accounts arrive in sprint 3                                              |
| Server-side logic | PocketBase `pb_hooks` (JavaScript) for the AI features; API keys stay on the server                                                          |
| Testing           | Vitest and React Testing Library (PocketBase is mocked)                                                                                      |
| Code quality      | ESLint and Prettier                                                                                                                          |
| Hosting           | Netlify (frontend) and AWS (PocketBase)                                                                                                      |
| Project tools     | GitHub (code, pull requests to a protected `main`), Trello (sprint board), Discord (team chat)                                               |

```
datedeck/
├── frontend/   React + Vite app (components/, hooks/, pages/, lib/pocketbase.js, styles/)
├── backend/    PocketBase (pb_migrations/, pb_hooks/)
└── docs/       PLAN.md (stories and acceptance criteria) and STYLE_GUIDE.md
```

# Software Features

The full stories with acceptance criteria are in [`docs/PLAN.md`](docs/PLAN.md).

### Minimum viable product

**Sprint 1: First deck (Oct 5 – Oct 16)**

- [x] DD-01 PocketBase database with a `dates` collection, saved as migrations
- [x] DD-05 Vite and React project on GitHub with lint and format setup
- [x] DD-03 IdeaCard component (photo, title, place, area, price, duration)
- [x] DD-07 Design tokens, app header, and a style guide
- [x] DD-02 Shared PocketBase client and `useIdeas` hook
- [x] DD-06 Add a date idea with a form that saves to PocketBase
- [ ] DD-04 Deck with Save and Hide buttons, remembered in the browser
- [ ] DD-08 30 real Rexburg date ideas loaded into PocketBase

**Sprint 2: Swipe, filter and ship (Oct 19 – Oct 30)**

- [ ] DD-09 Filter ideas in PocketBase by location and price
- [ ] DD-11 Swipe the card by dragging (mouse, touch, keyboard)
- [ ] DD-14 Browse all ideas and open an idea's details (with Open in Maps)
- [ ] DD-15 Liked (Saved) and Hidden lists
- [ ] DD-10 Put DateDeck online
- [ ] DD-12 Undo the last swipe and shuffle the deck
- [ ] DD-13 Location, price and category filters with search
- [ ] DD-16 Mobile-friendly layout

### Stretch goals

**Sprint 3: Accounts and AI (Nov 2 – Nov 13)**

- [ ] DD-17 Sign up and sign in
- [ ] DD-18 Keep saved and hidden ideas in your account
- [ ] DD-19 Ask the AI for a date idea
- [ ] DD-20 "Pick one for us" from saved ideas
- [ ] DD-21 Let the AI help write a new idea
- [ ] DD-22 Edit and remove my own ideas
- [ ] DD-23 Approve new ideas before they go live
- [ ] DD-24 Accessibility and polish pass

# Team Communication

- **Discord** for day-to-day chat and questions
- **Trello** board for sprint stories and who owns each one
- **GitHub** pull requests for code review; a teammate reviews every pull request before it is merged into `main`
- Team meetings are led by Riley Cluff

# Team Responsibilities

| Team member        | Development track              | Team role                                 |
| ------------------ | ------------------------------ | ----------------------------------------- |
| Rychen Jones       | PocketBase and data            | GitHub management, submitting assignments |
| Riley Cluff        | Deck and swiping               | Conducting meetings                       |
| Gabriel Wargha     | Forms, filters and React setup | Team assignment list                      |
| Talmage Trebilcock | Design, lists and quality      | Documentation, presentations              |

# Reflections

_To be completed at the end of the semester._
