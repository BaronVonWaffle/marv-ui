import { useState, useEffect } from 'react';

export default function useData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/data/pipeline_snapshot.json').then((r) => {
        if (!r.ok) throw new Error(`pipeline_snapshot: ${r.status}`);
        return r.json();
      }),
      fetch('/data/research_manifest.json')
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ])
      .then(([pipeline, research]) => {
        setData({ ...pipeline, research });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}
