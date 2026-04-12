import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
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
  faHistory
} from '@fortawesome/free-solid-svg-icons';
// eslint-disable-next-line no-unused-vars
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
      // 1) Vérification rapide côté client
      if (!authApi.isAuthenticated()) {
        navigate('/admin/login', { replace: true });
        return;
      }

      // 2) Vérification côté API (token encore valide ?)
      try {
        await authApi.getMe();
      } catch (e) {
        console.log(e);
        // authApi.logout();
        navigate('/admin/login', { replace: true });
        return;
      }

      // 3) Chargement des stats uniquement si authentifié
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

  const handleLogout = () => {
    authApi.logout();
    navigate('/admin/login');
  };

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await authApi.getMe();
        setCurrentUser(userData.user);
      } catch {
        // User data non disponible
      }
    };
    loadUser();
  }, []);

  const menuItems = [
    { icon: faHome, label: 'Dashboard', path: '/admin/dashboard', exact: true },
    { icon: faNewspaper, label: 'Actualités', path: '/admin/news', badge: stats.news },
    { icon: faTrophy, label: 'Palmarès', path: '/admin/palmares', badge: stats.palmares },
    { icon: faCalendarAlt, label: 'Planning', path: '/admin/schedule' },
    { icon: faImages, label: 'Galerie', path: '/admin/gallery', badge: stats.gallery },
    { icon: faEnvelope, label: 'Contacts', path: '/admin/contacts', badge: stats.unreadContacts, badgeColor: 'red' },
    { icon: faFistRaised, label: 'Activités', path: '/admin/activities' },
    { icon: faCog, label: 'Paramètres', path: '/admin/settings' },
    { icon: faHistory, label: 'Historique', path: '/admin/history' }
  ];

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
      <div className="admin-dashboard">
      {/* Sidebar */}
      <motion.aside
        className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -5 }}
      >
        <div className="sidebar-header">
          <h2>Administration</h2>
          <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>
            <FontAwesomeIcon icon={faTimes} />
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
          <button className="logout-btn" onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span>Déconnexion</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="admin-main">
        {/* Top Bar */}
        <header className="admin-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FontAwesomeIcon icon={faBars} />
          </button>
          <h1>Panneau d'Administration</h1>
          <div className="header-user">
            <span>Bienvenue, {currentUser?.username || 'Admin'}</span>
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

