import { useState, useEffect } from 'react';

export function useData<T>(url: string, defaultValue: T): [T, (val: T) => void, boolean, string | null] {
  const [data, setData] = useState<T>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`cache_${url}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch(e) {}
      }
    }
    return defaultValue;
  });
  
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`cache_${url}`);
      return cached ? false : true;
    }
    return true;
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    // We already have cached data, so loading can be false immediately for better UX
    // But we will still fetch to get the freshest data.
    
    fetch(url)
      .then(async res => {
        if (!res.ok) {
           let msg = 'Failed to fetch data';
           try {
             const errorData = await res.json();
             if (errorData.error) msg = errorData.error;
           } catch(e) {}
           throw new Error(msg);
        }
        return res.json();
      })
      .then(json => {
        if (mounted) {
          setData(json);
          localStorage.setItem(`cache_${url}`, JSON.stringify(json));
          setError(null);
        }
      })
      .catch(err => {
         if(mounted) {
            const cached = localStorage.getItem(`cache_${url}`);
            if (!cached) {
              setError(err.message + ' (Offline)');
            }
         }
      })
      .finally(() => {
         if(mounted) setLoading(false);
      });
      return () => { mounted = false; };
  }, [url]);

  const updateData = (newData: T) => {
    setData(newData);
    localStorage.setItem(`cache_${url}`, JSON.stringify(newData));
  };

  return [data, updateData, loading, error];
}
