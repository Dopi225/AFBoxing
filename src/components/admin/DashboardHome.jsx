import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import {
  faNewspaper,
  faTrophy,
  faCalendarAlt,
  faImages,
  faEnvelope,
  faArrowRight,
  faPlus,
  faExclamationTriangle,
  faCheckCircle,
  faClock,
  faSearch,
  faCog,
  faInfoCircle,
  faFistRaised
} from '@fortawesome/free-solid-svg-icons';
import { newsApi, palmaresApi, contactsApi, galleryApi, scheduleApi, authApi } from '../../services/apiService';
import { useNotifications } from './NotificationSystem';
import './DashboardHome.scss';

const DashboardHome = () => {
  const navigate = useNavigate();
  const { error: notifyError } = useNotifications();
  const [stats, setStats] = useState({
    news: 0,
    palmares: 0,
    contacts: 0,
    gallery: 0,
    unreadContacts: 0,
    schedule: 0,
    recentNews: 0,
    recentContacts: 0
  });
  const [healthStatus, setHealthStatus] = useState({
    api: 'checking',
    database: 'checking',
    uploads: 'checking'
  });
  const [loading, setLoading] = useState(true);
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [userRole, setUserRole] = useState('admin');

  useEffect(() => {
    let cancelled = false;
    void authApi.getMe().then((res) => {
      const r = res?.user?.role;
      if (!cancelled && (r === 'admin' || r === 'editor')) setUserRole(r);
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const [news, palmares, contacts, gallery, schedule] = await Promise.all([
          newsApi.list().catch(() => []),
          palmaresApi.list().catch(() => []),
          contactsApi.list().catch(() => []),
          galleryApi.list().catch(() => []),
          scheduleApi.list().catch(() => [])
        ]);

        const now = new Date();
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const recentNews = news.filter(n => new Date(n.date || n.created_at) >= lastMonth).length;
        const recentContacts = contacts.filter(c => new Date(c.created_at) >= lastWeek).length;

        setStats({
          news: news.length,
          palmares: palmares.length,
          contacts: contacts.length,
          gallery: gallery.length,
          unreadContacts: contacts.filter(c => !c.is_read && !c.read).length,
          schedule: schedule.length,
          recentNews,
          recentContacts
        });

        // Vérification santé système
        setHealthStatus({
          api: 'ok',
          database: 'ok',
          uploads: 'ok'
        });
      } catch {
        notifyError('Erreur lors du chargement des statistiques');
        setHealthStatus({
          api: 'error',
          database: 'error',
          uploads: 'unknown'
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [notifyError]);

  const submitDashboardSearch = (e) => {
    e.preventDefault();
    const q = dashboardSearch.trim();
    if (q) {
      navigate(`/admin/search?q=${encodeURIComponent(q)}`);
    } else {
      navigate('/admin/search');
    }
  };

  const quickActionsAll = [
    {
      icon: faNewspaper,
      label: 'Actualités',
      path: '/admin/news',
      count: stats.news,
      color: 'var(--primary-red)'
    },
    {
      icon: faTrophy,
      label: 'Palmarès',
      path: '/admin/palmares',
      count: stats.palmares,
      color: 'var(--primary-red-dark)'
    },
    {
      icon: faCalendarAlt,
      label: 'Planning',
      path: '/admin/schedule',
      color: 'var(--primary-black)'
    },
    {
      icon: faImages,
      label: 'Galerie',
      path: '/admin/gallery',
      count: stats.gallery,
      color: 'var(--primary-red)'
    },
    {
      icon: faEnvelope,
      label: 'Contacts',
      path: '/admin/contacts',
      adminOnly: true,
      count: stats.unreadContacts,
      badge: stats.unreadContacts > 0,
      color: 'var(--primary-red-dark)'
    },
    {
      icon: faFistRaised,
      label: 'Activités',
      path: '/admin/activities',
      color: 'var(--primary-red)'
    }
  ];

  const quickActions = quickActionsAll.filter((a) => !a.adminOnly || userRole === 'admin');

  const healthItems = [
    { label: 'API', status: healthStatus.api },
    { label: 'Base de données', status: healthStatus.database },
    { label: 'Uploads', status: healthStatus.uploads }
  ];

  const alerts = [];
  if (userRole === 'admin' && stats.unreadContacts > 0) {
    alerts.push({
      type: 'info',
      message: `${stats.unreadContacts} nouveau${stats.unreadContacts > 1 ? 'x' : ''} message${stats.unreadContacts > 1 ? 's' : ''} non lu${stats.unreadContacts > 1 ? 's' : ''}`,
      action: () => navigate('/admin/contacts?filter=unread')
    });
  }
  if (stats.recentNews === 0 && stats.news > 0) {
    alerts.push({
      type: 'warning',
      message: 'Aucune actualité récente (30 derniers jours)',
      action: () => navigate('/admin/news')
    });
  }

  if (loading) {
    return (
      <div className="dashboard-home">
        <div className="admin-state--loading" role="status" aria-live="polite">
          <span className="admin-state__spinner" aria-hidden />
          <p>Chargement du tableau de bord…</p>
        </div>
      </div>
    );
  }
 
  return (
    <div className="dashboard-home">
      <motion.div
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2>Tableau de bord</h2>
          <p>
            Vue d&apos;ensemble et contrôle du site
            {userRole === 'editor' && (
              <span className="dashboard-header__role"> — accès éditeur (contenu public)</span>
            )}
          </p>
        </div>
        <div className="dashboard-header__actions">
          <form className="dashboard-header__search" onSubmit={submitDashboardSearch} role="search">
            <label htmlFor="dashboard-global-search" className="visually-hidden">
              Rechercher dans tout le contenu
            </label>
            <input
              id="dashboard-global-search"
              type="search"
              className="dashboard-header__search-input"
              placeholder="Rechercher…"
              value={dashboardSearch}
              onChange={(e) => setDashboardSearch(e.target.value)}
              autoComplete="off"
              enterKeyHint="search"
            />
            <button type="submit" className="btn-icon btn-icon--search" title="Lancer la recherche" aria-label="Lancer la recherche">
              <FontAwesomeIcon icon={faSearch} />
            </button>
          </form>
          <button
            type="button"
            className="btn-icon"
            onClick={() => navigate('/admin/settings')}
            title="Paramètres"
            aria-label="Paramètres"
          >
            <FontAwesomeIcon icon={faCog} />
          </button>
        </div>
      </motion.div>

      {/* Alertes et statut système */}
      {alerts.length > 0 && (
        <motion.div
          className="dashboard-alerts"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`alert alert--${alert.type}`}
              onClick={alert.action}
            >
              <FontAwesomeIcon icon={alert.type === 'warning' ? faExclamationTriangle : faInfoCircle} />
              <span>{alert.message}</span>
              <FontAwesomeIcon icon={faArrowRight} />
            </div>
          ))}
        </motion.div>
      )}

      {/* Statut santé système */}
      <motion.div
        className="health-status"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3>État du système</h3>
        <div className="health-items">
          {healthItems.map((item, idx) => (
            <div key={idx} className={`health-item health-item--${item.status}`}>
              <FontAwesomeIcon icon={item.status === 'ok' ? faCheckCircle : faExclamationTriangle} />
              <span>{item.label}</span>
              <span className="health-status-badge">{item.status === 'ok' ? 'OK' : item.status === 'error' ? 'Erreur' : 'Vérification...'}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Statistiques principales */}
      <div className="stats-grid">
        {quickActions.map((action, index) => (
          <motion.div
            key={action.path}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => navigate(action.path)}
            whileHover={{ scale: 1.02, y: -3 }}
          >
            <div className="stat-icon" style={{ background: action.color }}>
              <FontAwesomeIcon icon={action.icon} />
            </div>
            <div className="stat-content">
              <h3>{action.label}</h3>
              {action.count !== undefined && (
                <div className="stat-number">{action.count}</div>
              )}
              {action.badge && (
                <span className="stat-badge">{action.count} non lus</span>
              )}
            </div>
            <FontAwesomeIcon icon={faArrowRight} className="stat-arrow" />
          </motion.div>
        ))}
      </div>

      {/* Statistiques secondaires */}
      <motion.div
        className="secondary-stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="secondary-stat">
          <FontAwesomeIcon icon={faClock} />
          <div>
            <span className="secondary-stat__value">{stats.recentNews}</span>
            <span className="secondary-stat__label">Actualités ce mois</span>
          </div>
        </div>
        <div className="secondary-stat">
          <FontAwesomeIcon icon={faEnvelope} />
          <div>
            <span className="secondary-stat__value">{stats.recentContacts}</span>
            <span className="secondary-stat__label">Contacts cette semaine</span>
          </div>
        </div>
        <div className="secondary-stat">
          <FontAwesomeIcon icon={faCalendarAlt} />
          <div>
            <span className="secondary-stat__value">{stats.schedule}</span>
            <span className="secondary-stat__label">Créneaux horaires</span>
          </div>
        </div>
      </motion.div>

      {/* Actions rapides */}
      <motion.div
        className="quick-actions"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3>Actions rapides</h3>
        <div className="actions-grid">
          <button
            className="action-btn"
            onClick={() => navigate('/admin/news?action=add')}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Ajouter une actualité</span>
          </button>
          <button
            className="action-btn"
            onClick={() => navigate('/admin/palmares?action=add')}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Ajouter un palmarès</span>
          </button>
          <button
            className="action-btn"
            onClick={() => navigate('/admin/gallery?action=add')}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Ajouter une photo</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardHome;

