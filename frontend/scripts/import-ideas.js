import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import PocketBase from 'pocketbase';
import { loadEnv } from 'vite';

const scriptPath = fileURLToPath(import.meta.url);
const frontendDir = resolve(dirname(scriptPath), '..');
const seedPath = resolve(frontendDir, '../backend/seed/dates.json');

// Seed IDs are display IDs, not valid PocketBase record IDs. Let PocketBase generate its own.
export async function importIdeas(pb, ideas) {
  const dates = pb.collection('dates');
  let added = 0;
  let skipped = 0;

  for (const idea of ideas) {
    const filter = pb.filter('title = {:title} && place_name = {:place}', {
      title: idea.title,
      place: idea.place_name,
    });

    try {
      await dates.getFirstListItem(filter, { requestKey: null });
      skipped += 1;
      continue;
    } catch (error) {
      // Only a missing record means it is safe to insert. Other failures must stop the import.
      if (error.status !== 404) throw error;
    }

    const record = { ...idea };
    delete record.id;
    await dates.create(record, { requestKey: null });
    added += 1;
  }

  return { added, skipped };
}

async function main() {
  const { VITE_POCKETBASE_URL: url } = loadEnv('development', frontendDir, 'VITE_POCKETBASE_URL');
  if (!url) {
    throw new Error(
      'Set VITE_POCKETBASE_URL in frontend/.env or your environment before importing.',
    );
  }

  // Only signed-in users can add ideas (DD-10), so the import signs in as a superuser.
  // These come from the shell, never from .env, so the password stays out of the app.
  const { PB_SUPERUSER_EMAIL: email, PB_SUPERUSER_PASSWORD: password } = process.env;
  if (!email || !password) {
    throw new Error('Set PB_SUPERUSER_EMAIL and PB_SUPERUSER_PASSWORD before importing.');
  }

  const pb = new PocketBase(url);
  await pb.collection('_superusers').authWithPassword(email, password, { requestKey: null });

  const ideas = JSON.parse(await readFile(seedPath, 'utf8'));
  const { added, skipped } = await importIdeas(pb, ideas);
  console.log(`${added} added, ${skipped} skipped.`);
}

// Importing this module in a test must never connect to a real database.
if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    if (error.status) {
      console.error(
        `Import failed (HTTP ${error.status}). Check PocketBase access and seed fields.`,
      );
    } else {
      console.error(error.message);
    }
    process.exitCode = 1;
  });
}
