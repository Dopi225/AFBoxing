import React from 'react';

/**
 * Fallback Suspense — squelette aligné sur une page type SectionHeader + grille.
 */
export default function RouteFallback() {
  return (
    <div className="route-fallback container-fluid" aria-busy="true" aria-live="polite">
      <div className="route-fallback__inner">
        <div className="skeleton skeleton--eyebrow" />
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--line short" />
        <div className="route-fallback__grid">
          <div className="skeleton skeleton--card" />
          <div className="skeleton skeleton--card" />
          <div className="skeleton skeleton--card" />
        </div>
        <p className="route-fallback__label">Chargement de la page</p>
      </div>
    </div>
  );
}
