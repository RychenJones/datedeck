import { readFile } from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import PocketBase from 'pocketbase';
import { loadEnv } from 'vite';
import sharp from 'sharp';

const scriptPath = fileURLToPath(import.meta.url);
const frontendDir = resolve(dirname(scriptPath), '..');
const seedPath = resolve(frontendDir, '../backend/seed/dates.json');

// Match IdeaCard.css's 600:285 crop at double resolution for sharper screens.
// The source links stay in dates.json; only the prepared files are uploaded.
export async function preparePhoto(input) {
  const image = sharp(input).rotate().resize(1200, 570, { fit: 'cover', position: 'centre' });
  for (const quality of [82, 72, 62, 52, 42, 32, 22]) {
    const data = await image.clone().webp({ quality, effort: 2 }).toBuffer();
    if (data.length < 200_000) {
      const hash = createHash('sha256').update(data).digest('hex').slice(0, 16);
      return { data, filename: `card_${hash}.webp` };
    }
  }
  throw new Error('Unable to compress a photo below 200 KB; no oversized photo was uploaded.');
}

// Seed IDs are display IDs, not valid PocketBase record IDs. Let PocketBase generate its own.
export async function importIdeas(pb, ideas) {
  const dates = pb.collection('dates');
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const idea of ideas) {
    const filter = pb.filter('title = {:title} && place_name = {:place}', {
      title: idea.title,
      place: idea.place_name,
    });

    let existing;
    try {
      existing = await dates.getFirstListItem(filter, { requestKey: null });
    } catch (error) {
      // Only a missing record means it is safe to insert. Other failures must stop the import.
      if (error.status !== 404) throw error;
    }

    const record = { ...idea };
    delete record.id;
    delete record.photo;

    let photo;
    if (idea.photo) {
      const response = await fetch(idea.photo, {
        headers: { 'User-Agent': 'Mozilla/5.0 (DateDeck seed importer)' },
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`Photo download failed (HTTP ${response.status}).`);
      photo = await preparePhoto(Buffer.from(await response.arrayBuffer()));
    }

    // PocketBase appends a random suffix to uploaded filenames. Compare the content hash
    // so rerunning the import doesn't upload an identical image or duplicate an idea.
    const photoMatches = photo
      ? existing?.photo === photo.filename ||
        (existing?.photo?.startsWith(`${photo.filename.slice(0, -5)}_`) &&
          existing.photo.endsWith('.webp'))
      : !existing?.photo;
    if (
      existing &&
      photoMatches &&
      Object.entries(record).every(([key, value]) => existing[key] === value)
    ) {
      skipped += 1;
      continue;
    }

    let payload = { ...record, photo: '' };
    if (photo) {
      payload = new FormData();
      for (const [key, value] of Object.entries(record)) payload.append(key, String(value));
      payload.append('photo', new Blob([photo.data], { type: 'image/webp' }), photo.filename);
    }
    if (existing) {
      await dates.update(existing.id, payload, { requestKey: null });
      updated += 1;
    } else {
      await dates.create(payload, { requestKey: null });
      added += 1;
    }
  }

  return { added, updated, skipped };
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
  const { added, updated, skipped } = await importIdeas(pb, ideas);
  console.log(`${added} added, ${updated} updated, ${skipped} skipped.`);
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
