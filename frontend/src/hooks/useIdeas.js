import { useEffect, useState } from 'react';
import { pb } from '../lib/pocketbase.js';

// Lists and adds ideas through the shared PocketBase client (DD-02).
export function useIdeas() {
  const [ideas, setIdeas] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    pb.collection('dates')
      .getFullList({
        sort: '-created',
        requestKey: null,
      })
      .then((items) => {
        if (!cancelled) {
          setIdeas(items);
          setStatus('ready');
        }
      })
      .catch((requestError) => {
        if (!cancelled && !requestError.isAbort) {
          setError(requestError);
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function addIdea(data) {
    setError(null);

    try {
      const idea = await pb.collection('dates').create(data, { requestKey: null });
      setIdeas((currentIdeas) => [idea, ...currentIdeas]);
      return idea;
    } catch (requestError) {
      if (!requestError.isAbort) setError(requestError);
      throw requestError;
    }
  }

  return { ideas, status, error, addIdea };
}
