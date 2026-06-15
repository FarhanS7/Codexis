import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { Repo } from '@/types/github';

interface UseReposResult {
  repos: Repo[];
  loading: boolean;
  error: string | null;
}

export function useRepos(): UseReposResult {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Repo[]>('/github/repos')
      .then((res) => setRepos(res.data))
      .catch((err) => {
        const message =
          err.response?.data?.message ??
          err.message ??
          'Failed to load repositories';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, []);

  return { repos, loading, error };
}
