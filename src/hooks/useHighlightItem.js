import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Met en évidence et fait défiler vers un élément (ex. depuis la recherche globale).
 */
export function useHighlightItem(itemId) {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const ref = useRef(null);

  const isHighlighted = highlightId && String(itemId) === String(highlightId);

  useEffect(() => {
    if (!isHighlighted || !ref.current) return;
    ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const t = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      next.delete('highlight');
      setSearchParams(next, { replace: true });
    }, 4000);
    return () => clearTimeout(t);
  }, [isHighlighted, searchParams, setSearchParams]);

  return { ref, isHighlighted };
}
