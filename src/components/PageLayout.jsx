import React from 'react';
import { OptimizedMotion, fadeInUp } from './OptimizedMotion';

const PageLayout = ({ 
  heroTitle, 
  heroSubtitle, 
  heroBackground = "linear-gradient(135deg, var(--primary-red), var(--primary-orange))",
  children,
  className = ""
}) => {
  return (
    <div className={`container-fluid page-layout ${className}`}>
      {/* Hero Section Standardisé */}
      <section className="page-hero" style={{ background: heroBackground }}>
        <div className="container">
          <OptimizedMotion variant={fadeInUp}>
            <div className="hero-content">
              <h1>{heroTitle}</h1>
              {heroSubtitle && <p>{heroSubtitle}</p>}
            </div>
          </OptimizedMotion>
        </div>
      </section>

      {/* Contenu principal */}
      <main className="page-main">
        {children}
      </main>
    </div>
  );
};

export default PageLayout;
