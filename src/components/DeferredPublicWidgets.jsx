import { useEffect, useState, lazy, Suspense } from 'react';

const StickyTarifCTA = lazy(() => import('./StickyTarifCTA'));
const ThemeFloatButton = lazy(() => import('./ThemeFloatButton'));
const BackToTopButton = lazy(() => import('./BackToTopButton'));

/**
 * Remonte le travail JS hors du chemin critique : CTA sticky, thème, retour haut de page
 * après idle (ou court délai si requestIdleCallback indisponible).
 */
export default function DeferredPublicWidgets() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const run = () => setShow(true);
    const w = window;
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(run, { timeout: 2800 });
      return () => w.cancelIdleCallback(id);
    }
    const t = w.setTimeout(run, 450);
    return () => w.clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <Suspense fallback={null}>
      <StickyTarifCTA />
      <ThemeFloatButton />
      <BackToTopButton />
    </Suspense>
  );
}
