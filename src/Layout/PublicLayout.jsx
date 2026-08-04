// layouts/PublicLayout.jsx
import React from 'react';
import Navbar from '../components/Navbar';
import { Outlet, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';
import { Helmet } from 'react-helmet-async';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { PREMIUM_EASE } from '../components/OptimizedMotion';

const PublicLayout = () => {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  return (
    <>
      <Helmet>
        <title>AF BOXING CLUB 86 — Boxe à Poitiers</title>
        <meta
          name="description"
          content="AF Boxing Club 86 — boxe et accompagnement socio-éducatif à Poitiers. Horaires, tarifs, équipe, contact."
        />
      </Helmet>
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          id="main-content"
          key={location.pathname}
          className="public-layout-outlet"
          tabIndex={-1}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{
            duration: reduceMotion ? 0 : 0.22,
            ease: PREMIUM_EASE,
          }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <Footer />
    </>
  );
};

export default PublicLayout;
