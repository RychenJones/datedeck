import PocketBase from 'pocketbase';

// Shared PocketBase client; the URL comes from .env (DD-02).
export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL);
