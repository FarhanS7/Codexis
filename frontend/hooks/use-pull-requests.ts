import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { PR } from '@/types/github';

interface UsePullRequestsResult {
  prs: PR[];
  loading: boolean;
  error: string | null;
}

export function usePullRequests(
  owner: string | null,
  repo: string | null,
): UsePullRequestsResult {
  const [prs, setPrs] = useState<PR[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!owner || !repo) {
      setPrs([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setPrs([]);

    api
      .get<PR[]>(`/github/repos/${owner}/${repo}/pulls`)
      .then((res) => setPrs(res.data))
      .catch((err) => {
        const message =
          err.response?.data?.message ??
          err.message ??
          'Failed to load pull requests';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [owner, repo]);

  return { prs, loading, error };
}
