import { useEffect, useCallback } from 'react';

export default function useDebounce(effect: () => void, dependencies: any[], delay: number, autoSearch?: boolean) {
  const callback = useCallback(effect, dependencies);

  useEffect(() => {
    if (autoSearch) {
      const timeout = setTimeout(callback, delay);
      return () => clearTimeout(timeout);
    }
  }, [callback, delay]);
}
