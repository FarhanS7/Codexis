import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { ParsedDiff } from '@/types/github';

interface UseParsedDiffResult {
  parsedDiff: ParsedDiff | null;
  loading: boolean;
  error: string | null;
}

export function useParsedDiff(
  owner: string | null,
  repo: string | null,
  prNumber: string | number | null,
): UseParsedDiffResult {
  const [parsedDiff, setParsedDiff] = useState<ParsedDiff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!owner || !repo || !prNumber) {
      return;
    }

    setLoading(true);
    setError(null);

    api
      .get<ParsedDiff>(`/github/repos/${owner}/${repo}/pulls/${prNumber}/diff`)
      .then((res) => setParsedDiff(res.data))
      .catch((err) => {
        const message =
          err.response?.data?.message ??
          err.message ??
          'Failed to load pull request diff';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [owner, repo, prNumber]);

  return { parsedDiff, loading, error };
}
