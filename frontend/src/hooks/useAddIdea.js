import { useState } from 'react';
import { pb } from '../lib/pocketbase.js';

// Adds an idea to the PocketBase dates collection (DD-06).
export function useAddIdea() {
  const [error, setError] = useState(null);

  async function addIdea(data) {
    setError(null);

    try {
      return await pb.collection('dates').create(data, { requestKey: null });
    } catch (requestError) {
      if (!requestError.isAbort) setError(requestError);
      throw requestError;
    }
  }

  return { addIdea, error };
}
