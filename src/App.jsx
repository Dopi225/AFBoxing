import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
// import Navbar from './components/Navbar';
// import Footer from './components/Footer';
import  PublicLayout  from "./Layout/PublicLayout";
const AssociationDeBoxe = React.lazy(() => import('./components/AssociationDeBoxe'));
const Apropos = React.lazy(() => import('./components/Apropos'));
const Activite = React.lazy(() => import('./components/Activite'));
const Actualite = React.lazy(() => import('./components/Actualite'));
const Equipe = React.lazy(() => import('./components/Equipe'));
const Galerie = React.lazy(() => import('./components/Galerie'));
const Horaire = React.lazy(() => import('./components/Horaire'));
const Tarif = React.lazy(() => import('./components/Tarif'));
const Contact = React.lazy(() => import('./components/Contact'));
const Partenaire = React.lazy(() => import('./components/Partenaire'));
const Palmares = React.lazy(() => import('./components/Palmares'));

import '@fortawesome/fontawesome-free/css/all.min.css';
import './App.scss';
const InfoPage = React.lazy(() => import('./components/InfoPage'));
const NewsPage = React.lazy(() => import('./components/NewsPage'));
import ScrollToTop from './components/ScrollToTop';
import BackToTopButton from './components/BackToTopButton';
import HeroSkipButton from './components/HeroSkipButton';
import StickyTarifCTA from './components/StickyTarifCTA';
import ErrorBoundary from './components/ErrorBoundary';

// Admin components
const AdminLogin = React.lazy(() => import('./components/admin/AdminLogin'));
const AdminDashboard = React.lazy(() => import('./components/admin/AdminDashboard'));
const DashboardHome = React.lazy(() => import('./components/admin/DashboardHome'));
const ManageNews = React.lazy(() => import('./components/admin/ManageNews'));
const ManagePalmares = React.lazy(() => import('./components/admin/ManagePalmares'));
const ManageSchedule = React.lazy(() => import('./components/admin/ManageSchedule'));
const ManageGallery = React.lazy(() => import('./components/admin/ManageGallery'));
const ManageContacts = React.lazy(() => import('./components/admin/ManageContacts'));
const GlobalSearch = React.lazy(() => import('./components/admin/GlobalSearch'));
const ManageSettings = React.lazy(() => import('./components/admin/ManageSettings'));
const ManageUsers = React.lazy(() => import('./components/admin/ManageUsers'));
const ManageActivities = React.lazy(() => import('./components/admin/ManageActivities'));
const ActivityLog = React.lazy(() => import('./components/admin/ActivityLog'));
const NotFound = React.lazy(() => import('./components/NotFound'));
const AdminAuthGate = React.lazy(() => import('./components/admin/AdminAuthGate'));

const RouteFallback = () => (
  <div className="container" style={{ padding: '4rem 1rem' }}>
    <div className="modern-card" style={{ textAlign: 'center' }}>
      <p style={{ margin: 0, fontWeight: 700 }}>Chargement…</p>
    </div>
  </div>
);

function App() {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Router>
        <ErrorBoundary>
        <ScrollToTop />
        {/* <Navbar /> */}
        <Suspense fallback={<RouteFallback />}>
          <Routes>
             {/* 🌍 Site public */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<AssociationDeBoxe />} />
              <Route path="/apropos" element={<Apropos />} />
              <Route path="/activite" element={<Activite />} />
              <Route path="/actualite" element={<Actualite />} />
              <Route path="/equipe" element={<Equipe />} />
              <Route path="/galerie" element={<Galerie />} />
              <Route path="/horaire" element={<Horaire />} />
              <Route path="/tarif" element={<Tarif />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/partenaire" element={<Partenaire />} />
              <Route path="/palmares" element={<Palmares />} />
              <Route path="/association" element={<AssociationDeBoxe />} />
              <Route path="/info/:type" element={<InfoPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminAuthGate />}>
              <Route element={<AdminDashboard />}>
                <Route index element={<DashboardHome />} />
                <Route path="dashboard" element={<DashboardHome />} />
                <Route path="news" element={<ManageNews />} />
                <Route path="palmares" element={<ManagePalmares />} />
                <Route path="schedule" element={<ManageSchedule />} />
                <Route path="gallery" element={<ManageGallery />} />
                <Route path="contacts" element={<ManageContacts />} />
                <Route path="activities" element={<ManageActivities />} />
                <Route path="history" element={<ActivityLog />} />
                <Route path="search" element={<GlobalSearch />} />
                <Route path="settings" element={<ManageSettings />} />
                <Route path="users" element={<ManageUsers />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
        <HeroSkipButton />
        <StickyTarifCTA />
        <BackToTopButton />
        {/* <Footer /> */}
        </ErrorBoundary>
      </Router>
    </MotionConfig>
  );
}

export default App;
