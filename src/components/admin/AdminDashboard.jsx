import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
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
  faUsers,
  faUserFriends,
  faMoneyBillWave,
  faChevronDown,
  faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
import { authApi, newsApi, palmaresApi, contactsApi, galleryApi } from '../../services/apiService';
import { NotificationProvider } from './NotificationSystem';
import SessionExpiryGuard from './SessionExpiryGuard';
import ThemeToggle from '../ThemeToggle';
import { APP_TITLE, NAV_SECTIONS, NAV_ITEMS, ROLES } from '../../constants/adminCopy';
import AdminOnboardingGuide from './AdminOnboardingGuide';
import './AdminDashboard.scss';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [followExpanded, setFollowExpanded] = useState(false);
  const [stats, setStats] = useState({
    news: 0,
    palmares: 0,
    contacts: 0,
    gallery: 0,
    unreadContacts: 0,
  });
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [hasSeenGuide, setHasSeenGuide] = useState(false);

  useEffect(() => {
    setHasSeenGuide(localStorage.getItem('afboxing_admin_guide_seen_v1') === 'true');
  }, []);

  useEffect(() => {
    const initDashboard = async () => {
      try {
        const me = await authApi.getMe();
        setCurrentUser(me?.user ?? null);
      } catch (e) {
        console.log(e);
        navigate('/admin/login', { replace: true });
        return;
      }

      try {
        const [news, palmares, contacts, gallery] = await Promise.all([
          newsApi.list().catch(() => []),
          palmaresApi.list().catch(() => []),
          contactsApi.list().catch(() => []),
          galleryApi.list().catch(() => []),
        ]);

        setStats({
          news: news.length,
          palmares: palmares.length,
          contacts: contacts.length,
          gallery: gallery.length,
          unreadContacts: contacts.filter((c) => !c.is_read && !c.read).length,
        });
      } catch (e) {
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

  const isAdmin = currentUser?.role === 'admin';
  const roleInfo = ROLES[currentUser?.role] || ROLES.editor;

  const workspaceItems = [
    { icon: faHome, label: NAV_ITEMS.dashboard, path: '/admin/dashboard', exact: true },
  ];

  const contentItems = [
    { icon: faNewspaper, label: NAV_ITEMS.news, path: '/admin/news', badge: stats.news },
    { icon: faTrophy, label: NAV_ITEMS.palmares, path: '/admin/palmares', badge: stats.palmares },
    { icon: faImages, label: NAV_ITEMS.gallery, path: '/admin/gallery', badge: stats.gallery },
    { icon: faFistRaised, label: NAV_ITEMS.activities, path: '/admin/activities' },
    { icon: faUserFriends, label: NAV_ITEMS.team, path: '/admin/team' },
    { icon: faCalendarAlt, label: NAV_ITEMS.schedule, path: '/admin/schedule' },
  ];

  const clubItems = isAdmin
    ? [
        { icon: faEnvelope, label: NAV_ITEMS.contacts, path: '/admin/contacts', badge: stats.unreadContacts, badgeColor: 'red' },
        { icon: faMoneyBillWave, label: NAV_ITEMS.pricing, path: '/admin/pricing' },
        { icon: faCog, label: NAV_ITEMS.settings, path: '/admin/settings' },
        { icon: faUsers, label: NAV_ITEMS.users, path: '/admin/users' },
      ]
    : [];

  const followItems = isAdmin
    ? [{ icon: faHistory, label: NAV_ITEMS.history, path: '/admin/history' }]
    : [];

  const renderNavItem = (item) => {
    const currentPath = location.pathname;
    const isActive =
      currentPath === item.path ||
      (item.exact && (currentPath === '/admin' || currentPath === '/admin/dashboard'));

    return (
      <button
        key={item.path}
        type="button"
        className={`nav-item ${isActive ? 'active' : ''}`}
        onClick={() => {
          navigate(item.path);
          setSidebarOpen(false);
        }}
      >
        <FontAwesomeIcon icon={item.icon} aria-hidden />
        <span>{item.label}</span>
        {item.badge !== undefined && item.badge > 0 ? (
          <span className={`badge ${item.badgeColor || ''}`}>{item.badge}</span>
        ) : null}
      </button>
    );
  };

  const renderSection = (title, items) => {
    if (!items.length) return null;
    return (
      <div className="nav-section">
        <div className="nav-section-label">{title}</div>
        {items.map(renderNavItem)}
      </div>
    );
  };

  if (checkingAuth) {
    return (
      <div className="admin-dashboard loading">
        <div className="admin-main">
          <header className="admin-header">
            <h1>{APP_TITLE}</h1>
          </header>
          <main className="admin-content">
            <p role="status">Vérification de votre connexion…</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <SessionExpiryGuard />
      <Helmet>
        <title>{APP_TITLE} — AF BOXING CLUB 86</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="admin-dashboard">
        <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <h2>{APP_TITLE}</h2>
            <button
              type="button"
              className="close-sidebar"
              onClick={() => setSidebarOpen(false)}
              aria-label="Fermer le menu"
            >
              <FontAwesomeIcon icon={faTimes} aria-hidden />
            </button>
          </div>

          <nav className="sidebar-nav" aria-label="Menu principal">
            {renderSection(NAV_SECTIONS.workspace, workspaceItems)}
            {renderSection(NAV_SECTIONS.content, contentItems)}
            {renderSection(NAV_SECTIONS.club, clubItems)}
            {followItems.length > 0 ? (
              <div className="nav-section">
                <button
                  type="button"
                  className="nav-section-toggle"
                  onClick={() => setFollowExpanded((v) => !v)}
                  aria-expanded={followExpanded}
                >
                  <span className="nav-section-label">{NAV_SECTIONS.follow}</span>
                  <FontAwesomeIcon icon={followExpanded ? faChevronUp : faChevronDown} aria-hidden />
                </button>
                {followExpanded ? followItems.map(renderNavItem) : null}
              </div>
            ) : null}
          </nav>

          <div className="sidebar-footer">
            <button
              type="button"
              className="help-btn"
              onClick={() => setIsGuideOpen(true)}
              title={hasSeenGuide ? 'Revoir le guide' : 'Démarrer le guide'}
            >
              <span>{hasSeenGuide ? 'Revoir le guide' : 'Aide guidée'}</span>
            </button>
            <button type="button" className="logout-btn" onClick={handleLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} aria-hidden />
              <span>Déconnexion</span>
            </button>
          </div>
        </aside>

        <div className="admin-main">
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
            <h1>{APP_TITLE}</h1>
            <div className="header-user">
              <button
                type="button"
                className="header-help-btn"
                onClick={() => setIsGuideOpen(true)}
                title={hasSeenGuide ? 'Revoir le guide' : 'Démarrer le guide'}
              >
                {hasSeenGuide ? 'Revoir le guide' : 'Aide'}
              </button>
              <div className="admin-header__theme">
                <ThemeToggle compact />
              </div>
              <div className="header-user__info">
                <span className="header-user__hello">{currentUser?.username || 'Utilisateur'}</span>
                <span className="header-user__role">{roleInfo.label}</span>
                <span className="header-user__role-help">{roleInfo.help}</span>
              </div>
            </div>
          </header>

          <main className="admin-content">
            <Outlet />
          </main>
        </div>

        {sidebarOpen ? (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} role="presentation" />
        ) : null}
        <AdminOnboardingGuide
          isOpen={isGuideOpen}
          onClose={() => {
            setIsGuideOpen(false);
            setHasSeenGuide(localStorage.getItem('afboxing_admin_guide_seen_v1') === 'true');
          }}
          role={currentUser?.role}
        />
      </div>
    </NotificationProvider>
  );
};

export default AdminDashboard;
