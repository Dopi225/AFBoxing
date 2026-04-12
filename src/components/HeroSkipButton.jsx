import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';

const HERO_SELECTORS = [
  '.hero-section',
  '.section-header',
  '.about-hero',
  '.info-hero',
  '.palmares-hero',
  '.page-hero',
  '.news-hero',
  '.partners-hero',
  '.schedule-hero',
  '.gallery-hero',
  '.pricing-hero',
];

const HOME_PATHS = new Set(['/', '/association']);

function HeroSkipButton() {
  const location = useLocation();
  const [nodes, setNodes] = useState({ hero: null, target: null });

  const evaluateNodes = useCallback(() => {
    if (HOME_PATHS.has(location.pathname)) {
      setNodes({ hero: null, target: null });
      return;
    }

    const heroElement = document.querySelector(HERO_SELECTORS.join(', '));

    if (!heroElement) {
      setNodes({ hero: null, target: null });
      return;
    }

    let targetElement = heroElement.nextElementSibling;

    while (targetElement && targetElement.getBoundingClientRect().height === 0) {
      targetElement = targetElement.nextElementSibling;
    }

    if (!targetElement) {
      targetElement =
        heroElement.parentElement?.querySelector(
          'main, section:not([class*="hero"])',
        ) ?? null;
    }

    setNodes({ hero: heroElement, target: targetElement });
  }, [location.pathname]);

  useEffect(() => {
    let animationFrame = requestAnimationFrame(evaluateNodes);

    return () => cancelAnimationFrame(animationFrame);
  }, [evaluateNodes]);

  if (!nodes.hero || !nodes.target) {
    return null;
  }

  const handleClick = () => {
    nodes.target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (nodes.target instanceof HTMLElement) {
      nodes.target.focus?.({ preventScroll: true });
    }
  };

  const button = (
    <button
      type="button"
      className="hero-skip-button"
      onClick={handleClick}
      aria-controls={nodes.target.id || undefined}
    >
      <span>Accéder au contenu</span>
      <i className="fas fa-arrow-down" aria-hidden="true" />
    </button>
  );

  return createPortal(button, nodes.hero);
}

export default HeroSkipButton;

