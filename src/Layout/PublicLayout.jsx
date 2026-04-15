// layouts/PublicLayout.jsx
import React, { Suspense } from 'react';
import Navbar from '../components/Navbar';
import { Outlet, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';
import { Helmet } from 'react-helmet-async';
const AdminStaffShortcut = React.lazy(() => import('../components/AdminStaffShortcut'));
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
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          className="public-layout-outlet"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{
            duration: reduceMotion ? 0 : 0.22,
            ease: PREMIUM_EASE,
          }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      <Footer />
      <Suspense fallback={null}>
        <AdminStaffShortcut />
      </Suspense>
    </>
  );
};

export default PublicLayout;
