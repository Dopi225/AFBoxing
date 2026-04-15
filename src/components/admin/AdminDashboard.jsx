import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faNewspaper,
  faTrophy,
  faCalendarAlt,
  faImages,
  faEnvelope,
  faSignOutAlt,
  faBars,
  faTimes,
  faCog,
  faFistRaised,
  faHistory,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { authApi, newsApi, palmaresApi, contactsApi, galleryApi } from '../../services/apiService';
import { NotificationProvider } from './NotificationSystem';
import './AdminDashboard.scss';

const AdminDashboard = () => {
  const navigate = useNavigate(); 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    news: 0,
    palmares: 0,
    contacts: 0,
    gallery: 0,
    unreadContacts: 0
  });
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const initDashboard = async () => {
      // Garde route : AdminAuthGate — ici validation API + rôle pour le menu
      try {
        const me = await authApi.getMe();
        setCurrentUser(me?.user ?? null);
      } catch (e) {
        console.log(e);
        navigate('/admin/login', { replace: true });
        return;
      }

      // Chargement des stats
      try {
        const [news, palmares, contacts, gallery] = await Promise.all([
          newsApi.list().catch(() => []),
          palmaresApi.list().catch(() => []),
          contactsApi.list().catch(() => []),
          galleryApi.list().catch(() => [])
        ]);

        setStats({
          news: news.length,
          palmares: palmares.length,
          contacts: contacts.length,
          gallery: gallery.length,
          unreadContacts: contacts.filter(c => !c.is_read && !c.read).length
        });
      } catch (e) {
        // En cas d'erreur, on laisse les stats à zéro
        console.log(e);
      } finally {
        setCheckingAuth(false);
      }
    };

    initDashboard();
  }, [navigate]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = async () => {
    await authApi.logout();
    navigate('/admin/login');
  };

  const [currentUser, setCurrentUser] = useState(null);

  const staffMenuItems = [
    { icon: faHome, label: 'Dashboard', path: '/admin/dashboard', exact: true },
    { icon: faNewspaper, label: 'Actualités', path: '/admin/news', badge: stats.news },
    { icon: faTrophy, label: 'Palmarès', path: '/admin/palmares', badge: stats.palmares },
    { icon: faCalendarAlt, label: 'Planning', path: '/admin/schedule' },
    { icon: faImages, label: 'Galerie', path: '/admin/gallery', badge: stats.gallery },
    { icon: faFistRaised, label: 'Activités', path: '/admin/activities' }
  ];

  const adminOnlyMenuItems = [
    { icon: faEnvelope, label: 'Contacts', path: '/admin/contacts', badge: stats.unreadContacts, badgeColor: 'red' },
    { icon: faCog, label: 'Paramètres', path: '/admin/settings' },
    { icon: faHistory, label: 'Historique', path: '/admin/history' },
    { icon: faUsers, label: 'Utilisateurs', path: '/admin/users' }
  ];

  const menuItems =
    currentUser?.role === 'admin' ? [...staffMenuItems, ...adminOnlyMenuItems] : staffMenuItems;

  const handleNavClick = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  if (checkingAuth) {
    return (
      <div className="admin-dashboard loading">
        <div className="admin-main">
          <header className="admin-header">
            <h1>Panneau d'Administration</h1>
          </header>
          <main className="admin-content">
            <p>Vérification de l'authentification...</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <Helmet>
        <title>Administration — AF BOXING CLUB 86</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="admin-dashboard">
      {/* Sidebar — ouverture/fermeture gérée en CSS (mobile) pour éviter les conflits avec Framer Motion */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Administration</h2>
          <button
            type="button"
            className="close-sidebar"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fermer le menu latéral"
          >
            <FontAwesomeIcon icon={faTimes} aria-hidden />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, index) => {
            const currentPath = window.location.pathname;
            const isActive = currentPath === item.path || 
                           (item.exact && (currentPath === '/admin' || currentPath === '/admin/dashboard'));
            
            return (
              <motion.button
                key={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.path)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 5 }}
              >
                <FontAwesomeIcon icon={item.icon} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`badge ${item.badgeColor || ''}`}>
                    {item.badge}
                  </span>
                )}
              </motion.button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="logout-btn" onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        {/* Top Bar */}
        <header className="admin-header">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={sidebarOpen}
          >
            <FontAwesomeIcon icon={faBars} aria-hidden />
          </button>
          <h1>Panneau d&apos;administration</h1>
          <div className="header-user">
            <span className="header-user__hello">
              {currentUser?.username || 'Admin'}
              {currentUser?.role === 'admin' && (
                <span className="header-user__role" title="Accès complet (contacts, paramètres, utilisateurs)">
                  {' '}
                  — Administrateur
                </span>
              )}
              {currentUser?.role === 'editor' && (
                <span className="header-user__role" title="Contenu public (actualités, planning, galerie, activités)">
                  {' '}
                  — Éditeur
                </span>
              )}
            </span>
          </div>
        </header>

        {/* Content Area */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>

      {/* Overlay pour mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      </div>
    </NotificationProvider>
  );
};

export default AdminDashboard;

