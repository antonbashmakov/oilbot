import { useState, useEffect } from 'react';

interface BuildInfo {
  version: string;
  buildDate: string;
  buildTimestamp: number;
  commitHash: string;
  branch: string;
  buildNumber: number;
}

export function useBuildInfo() {
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBuildInfo() {
      try {
        const response = await fetch('/build-info.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch build info: ${response.status}`);
        }
        const data: BuildInfo = await response.json();

        setBuildInfo(data);
      } catch (err) {
        console.error('Error loading build info:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchBuildInfo();
  }, []);

  return { buildInfo, loading, error };
}
