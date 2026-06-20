import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import type { MetricsSummary } from 'shared/metrics';
import type { UseMetricsReturn } from '../types/metrics';

export function useMetrics(): UseMetricsReturn {
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<MetricsSummary>('/metrics/summary');
      setSummary(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { summary, loading, error, refetch: fetch };
}
