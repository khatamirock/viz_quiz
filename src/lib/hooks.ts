import { useState, useEffect } from 'react';

export function useData<T>(url: string, defaultValue: T): [T, (val: T) => void, boolean, string | null] {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(json => {
        if (mounted) {
          setData(json);
          setError(null);
        }
      })
      .catch(err => {
         if(mounted) setError(err.message);
      })
      .finally(() => {
         if(mounted) setLoading(false);
      });
      return () => { mounted = false; };
  }, [url]);

  return [data, setData, loading, error];
}
