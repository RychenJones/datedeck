# DateDeck — Developer Setup

This guide explains how to set up the local PocketBase backend for DateDeck.

Each developer runs their own local PocketBase instance and has their own local database. The database schema is shared through GitHub using PocketBase migrations.

## How this works

Each developer has:

* Their own PocketBase executable
* Their own `pb_data/` database
* The same `pb_migrations/` schema shared through GitHub

Your local database is **not** shared with the other developers.

Do **not** commit `pb_data/` or the PocketBase executable to GitHub.

---

## 1. Clone the repository

Clone the DateDeck repository:

```bash
git clone <REPOSITORY-URL>
```

Then enter the project:

```bash
cd DateDeck
```

If you already have the repository, simply pull the latest changes:

```bash
git pull
```

---

## 2. Download PocketBase

Download the appropriate PocketBase release for your operating system from the official PocketBase releases page:

https://github.com/pocketbase/pocketbase/releases

Choose the appropriate build:

* macOS Apple Silicon → `darwin_arm64`
* macOS Intel → `darwin_amd64`
* Windows → `windows_amd64`
* Linux → choose the appropriate Linux build

You can check a Mac's processor architecture with:

```bash
uname -m
```

`arm64` means Apple Silicon.

`x86_64` means Intel.

---

## 3. Put the PocketBase executable in the backend folder

After downloading and extracting PocketBase, place the executable inside:

```text
DateDeck/
└── backend/
    └── pocketbase
```

Do not rename the executable.

Your backend folder should eventually look like:

```text
backend/
├── pocketbase
├── pb_data/
└── pb_migrations/
```

`pb_data/` and `pocketbase` are ignored by Git and should not appear in GitHub.

---

## 4. macOS users: make PocketBase executable

If you are using macOS, open Terminal in the `backend` directory and run:

```bash
chmod +x pocketbase
```

Windows users do not need to do this.

---

## 5. Verify PocketBase

From the `backend` directory, run:

### macOS/Linux

```bash
./pocketbase --help
```

### Windows

```powershell
.\pocketbase.exe --help
```

If PocketBase displays its help information, the installation is working.

---

## 6. Start PocketBase

From the `backend` directory:

### macOS/Linux

```bash
./pocketbase serve
```

### Windows

```powershell
.\pocketbase.exe serve
```

PocketBase should start at:

```text
http://127.0.0.1:8090
```

Leave this terminal running while developing.

---

## 7. Create your local admin account

Open:

```text
http://127.0.0.1:8090/_/
```

Create your own PocketBase superuser account.

Each developer should have their **own** account. Do not share admin credentials.

This account only applies to your local PocketBase instance.

---

## 8. Database migrations

The DateDeck database schema is managed through PocketBase migrations.

The `pb_migrations/` directory is shared through GitHub.

For example:

```text
pb_migrations/
├── create_date_ideas.js
├── add_location.js
└── add_price.js
```

These files describe changes to the database structure.

When you pull new migrations from GitHub, PocketBase will apply the unapplied migrations to your local database.

### Important

Do not manually recreate collections that already exist in the migrations.

Do not commit your local `pb_data/`.

---

## 9. Your local database

Your local database is stored in:

```text
backend/pb_data/
```

This directory is intentionally ignored by Git.

For example, you might have:

```text
Your database:
- Bowling
- Hiking
- Picnic
```

while another developer might have:

```text
Their database:
- Mini Golf
- Movie
- Ice Skating
```

These records are independent.

This is expected during local development.

---

## 10. Working with Git branches

Use a separate branch for your work.

For example:

```bash
git checkout -b feature/date-filters
```

Make your changes, then commit and push them:

```bash
git add .
git commit -m "Add date filters"
git push -u origin feature/date-filters
```

Before starting new work, pull the latest changes:

```bash
git checkout main
git pull
```

Then create your new feature branch.

---

## 11. Important Git rules

### DO commit:

* Frontend source code
* Backend code
* `pb_migrations/`
* Configuration files intended for the repository
* Documentation

### DO NOT commit:

```text
backend/pb_data/
backend/pocketbase
```

These are already included in `.gitignore`.

Never force-add them with:

```bash
git add -f
```

---

## 12. Connecting the frontend

During local development, the frontend connects to your local PocketBase instance:

```text
http://127.0.0.1:8090
```

Each developer's frontend therefore communicates with their own local database.

Later, when DateDeck is hosted, the frontend will be configured to communicate with the shared hosted PocketBase server instead.

---

## Quick Start

After the initial setup, starting DateDeck should generally be:

### Terminal 1 — PocketBase

```bash
cd DateDeck/backend
./pocketbase serve
```

### Terminal 2 — Frontend

```bash
cd DateDeck/frontend
npm install
npm run dev
```

Then open the frontend's local development URL.

Keep both servers running while developing.

---

## Troubleshooting

### "Permission denied" on macOS

Run:

```bash
chmod +x pocketbase
```

Then try again.

### macOS says PocketBase cannot be opened

macOS may block downloaded executables that are not verified by Apple.

If you downloaded PocketBase from the official PocketBase GitHub releases page, go to:

**System Settings → Privacy & Security**

and look for the message about PocketBase being blocked. Use **Open Anyway** if you have verified that you downloaded the official release.

### Port 8090 is already in use

Another PocketBase instance may already be running.

Close the existing PocketBase process or start PocketBase on another port.

### My database doesn't have the latest collections

Make sure you:

1. Pulled the latest Git changes.
2. Have the latest `pb_migrations/`.
3. Restarted PocketBase.

Migrations are applied to your local database when PocketBase starts.
