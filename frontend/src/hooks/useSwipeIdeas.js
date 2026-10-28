import { useEffect, useState } from 'react';
import { pb } from '../lib/pocketbase.js';
import samples from '../data/sample-ideas.json';

// Fetch the actual saved/hidden records, including IDs beyond the first deck page.
export function useSwipeIdeas(saved, hidden) {
  const idsKey = JSON.stringify([...new Set([...saved, ...hidden])].sort());
  const [result, setResult] = useState({ key: null, ideas: [], error: false });

  useEffect(() => {
    const ids = JSON.parse(idsKey);
    const sampleIds = new Set(samples.map((idea) => idea.id));
    const remoteIds = ids.filter((id) => !sampleIds.has(id));
    let cancelled = false;
    async function load() {
      try {
        const records = [];
        for (let offset = 0; offset < remoteIds.length; offset += 50) {
          const params = {};
          const checks = remoteIds.slice(offset, offset + 50).map((id, index) => {
            params[`id${index}`] = id;
            return `id = {:id${index}}`;
          });
          const batch = await pb.collection('dates').getFullList({
            filter: pb.filter(checks.join(' || '), params),
            requestKey: null,
          });
          records.push(
            ...batch.map((idea) =>
              idea.photo ? { ...idea, photo: pb.files.getURL(idea, idea.photo) } : idea,
            ),
          );
        }
        if (!cancelled)
          setResult({
            key: idsKey,
            ideas: [...samples.filter((idea) => ids.includes(idea.id)), ...records],
            error: false,
          });
      } catch (error) {
        if (!cancelled && !error.isAbort)
          setResult({
            key: idsKey,
            ideas: samples.filter((idea) => ids.includes(idea.id)),
            error: true,
          });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  return {
    ideas: result.ideas,
    status: result.key !== idsKey ? 'loading' : result.error ? 'error' : 'ready',
  };
}
