import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faNewspaper,
  faImages,
  faEnvelope,
  faPlus,
  faExclamationTriangle,
  faCheckCircle,
  faSearch,
  faChevronDown,
  faChevronUp,
  faCalendarAlt,
} from '@fortawesome/free-solid-svg-icons';
import {
  newsApi,
  contactsApi,
  galleryApi,
  scheduleApi,
  authApi,
  activitiesApi,
} from '../../services/apiService';
import { parseLocalDate } from '../../utils/dateFormat';
import { useAdminNotify } from '../../hooks/useAdminNotify';
import TaskCard from './guided/TaskCard';
import './DashboardHome.scss';

const DashboardHome = () => {
  const navigate = useNavigate();
  const { notifyError } = useAdminNotify('dashboard');
  const [stats, setStats] = useState({
    news: 0,
    unreadContacts: 0,
    recentNews: 0,
    schedule: 0,
    activities: 0,
  });
  const [healthOk, setHealthOk] = useState(true);
  const [loading, setLoading] = useState(true);
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [userRole, setUserRole] = useState('admin');
  const [username, setUsername] = useState('');
  const [healthExpanded, setHealthExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void authApi
      .getMe()
      .then((res) => {
        const u = res?.user;
        if (!cancelled) {
          if (u?.role === 'admin' || u?.role === 'editor') setUserRole(u.role);
          if (u?.username) setUsername(u.username);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const settled = await Promise.allSettled([
          newsApi.list(),
          userRole === 'admin' ? contactsApi.list() : Promise.resolve([]),
          scheduleApi.list(),
          activitiesApi.list(),
        ]);

        const unwrap = (i, fallback = []) =>
          settled[i].status === 'fulfilled' && Array.isArray(settled[i].value)
            ? settled[i].value
            : fallback;

        const news = unwrap(0);
        const contacts = unwrap(1);
        const schedule = unwrap(2);
        const activities = unwrap(3);

        const criticalFailed = [0, 2, 3].some((i) => settled[i].status === 'rejected');
        if (userRole === 'admin' && settled[1].status === 'rejected') {
          // contacts admin en échec → health dégradé
        }

        const now = new Date();
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const recentNews = news.filter((n) => {
          const d = parseLocalDate(n.date || n.created_at);
          return d && d >= lastMonth;
        }).length;

        setStats({
          news: news.length,
          unreadContacts: contacts.filter((c) => !c.is_read && !c.read).length,
          recentNews,
          schedule: schedule.length,
          activities: activities.filter((a) => a.enabled !== false).length,
        });
        setHealthOk(!criticalFailed && !(userRole === 'admin' && settled[1].status === 'rejected'));
        if (criticalFailed) {
          notifyError(null, 'Certaines données du tableau de bord sont indisponibles.');
        }
      } catch {
        notifyError(null, 'Impossible de charger les informations du tableau de bord.');
        setHealthOk(false);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [notifyError, userRole]);

  const submitDashboardSearch = (e) => {
    e.preventDefault();
    const q = dashboardSearch.trim();
    navigate(q ? `/admin/search?q=${encodeURIComponent(q)}` : '/admin/search');
  };

  const tasks = [];
  if (userRole === 'admin' && stats.unreadContacts > 0) {
    tasks.push({
      title: `${stats.unreadContacts} message${stats.unreadContacts > 1 ? 's' : ''} non lu${stats.unreadContacts > 1 ? 's' : ''}`,
      description: 'Des visiteurs ont écrit au club. Prenez le temps de les lire.',
      actionLabel: 'Lire les messages',
      variant: 'info',
      onClick: () => navigate('/admin/contacts?filter=unread'),
    });
  }
  if (stats.recentNews === 0 && stats.news > 0) {
    tasks.push({
      title: 'Aucune actualité récente',
      description: "Vous n'avez pas publié d'actualité depuis 30 jours.",
      actionLabel: 'Publier une actualité',
      variant: 'warning',
      onClick: () => navigate('/admin/news?action=add'),
    });
  }
  if (stats.activities > 0 && stats.schedule === 0) {
    tasks.push({
      title: 'Planning vide',
      description: 'Vos activités existent mais le planning n\'a pas encore de créneaux.',
      actionLabel: 'Compléter le planning',
      variant: 'warning',
      onClick: () => navigate('/admin/schedule'),
    });
  }
  if (stats.news === 0) {
    tasks.push({
      title: 'Première actualité à publier',
      description: 'Commencez par annoncer une nouvelle du club sur le site.',
      actionLabel: 'Publier une actualité',
      variant: 'info',
      onClick: () => navigate('/admin/news?action=add'),
    });
  }

  const shortcuts = [
    { label: 'Actualités', path: '/admin/news', icon: faNewspaper },
    { label: 'Galerie', path: '/admin/gallery', icon: faImages },
    { label: 'Planning', path: '/admin/schedule', icon: faCalendarAlt },
  ];
  if (userRole === 'admin') {
    shortcuts.push({
      label: 'Messages',
      path: '/admin/contacts',
      icon: faEnvelope,
      badge: stats.unreadContacts,
    });
  }

  if (loading) {
    return (
      <div className="dashboard-home">
        <div className="admin-state--loading" role="status" aria-live="polite">
          <span className="admin-state__spinner" aria-hidden />
          <p>Chargement de votre espace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-home">
      <header className="dashboard-greeting">
        <div>
          <h2>Bonjour{username ? `, ${username}` : ''} !</h2>
          <p className="dashboard-greeting__sub">
            Voici ce qui demande votre attention aujourd&apos;hui.
          </p>
        </div>
        <form className="dashboard-header__search" onSubmit={submitDashboardSearch} role="search">
          <label htmlFor="dashboard-global-search" className="visually-hidden">
            Rechercher sur le site
          </label>
          <input
            id="dashboard-global-search"
            type="search"
            className="dashboard-header__search-input"
            placeholder="Rechercher une actualité, un nom…"
            value={dashboardSearch}
            onChange={(e) => setDashboardSearch(e.target.value)}
            autoComplete="off"
            enterKeyHint="search"
          />
          <button type="submit" className="btn-icon btn-icon--search" aria-label="Lancer la recherche">
            <FontAwesomeIcon icon={faSearch} />
          </button>
        </form>
      </header>

      {tasks.length > 0 ? (
        <section className="dashboard-tasks" aria-labelledby="dashboard-tasks-title">
          <h3 id="dashboard-tasks-title">À faire</h3>
          <div className="dashboard-tasks__list">
            {tasks.map((task, i) => (
              <TaskCard key={i} {...task} />
            ))}
          </div>
        </section>
      ) : (
        <section className="dashboard-all-clear" role="status">
          <FontAwesomeIcon icon={faCheckCircle} />
          <p>Tout est à jour. Vous pouvez utiliser les actions ci-dessous si besoin.</p>
        </section>
      )}

      <section className="dashboard-frequent" aria-labelledby="dashboard-frequent-title">
        <h3 id="dashboard-frequent-title">Actions fréquentes</h3>
        <div className="dashboard-frequent__grid">
          <button type="button" className="action-btn action-btn--large" onClick={() => navigate('/admin/news?action=add')}>
            <FontAwesomeIcon icon={faPlus} />
            <span>Publier une actualité</span>
          </button>
          <button type="button" className="action-btn action-btn--large" onClick={() => navigate('/admin/gallery?action=add')}>
            <FontAwesomeIcon icon={faPlus} />
            <span>Ajouter une photo</span>
          </button>
          {userRole === 'admin' ? (
            <button type="button" className="action-btn action-btn--large" onClick={() => navigate('/admin/contacts')}>
              <FontAwesomeIcon icon={faEnvelope} />
              <span>Voir les messages</span>
            </button>
          ) : null}
        </div>
      </section>

      <section className="dashboard-shortcuts" aria-labelledby="dashboard-shortcuts-title">
        <h3 id="dashboard-shortcuts-title">Accès rapide</h3>
        <div className="dashboard-shortcuts__grid">
          {shortcuts.map((s) => (
            <button key={s.path} type="button" className="shortcut-card" onClick={() => navigate(s.path)}>
              <FontAwesomeIcon icon={s.icon} />
              <span>{s.label}</span>
              {s.badge > 0 ? <span className="shortcut-card__badge">{s.badge}</span> : null}
            </button>
          ))}
        </div>
      </section>

      {userRole === 'admin' ? (
        <section className="dashboard-health">
          <button
            type="button"
            className="dashboard-health__toggle"
            onClick={() => setHealthExpanded((v) => !v)}
            aria-expanded={healthExpanded}
          >
            <span>
              <FontAwesomeIcon icon={healthOk ? faCheckCircle : faExclamationTriangle} />
              {healthOk
                ? 'Le site fonctionne correctement'
                : 'Un problème technique a été détecté — contactez le support informatique'}
            </span>
            <FontAwesomeIcon icon={healthExpanded ? faChevronUp : faChevronDown} aria-hidden />
          </button>
          {healthExpanded ? (
            <p className="dashboard-health__detail">
              Si le site public ne s&apos;affiche pas correctement, contactez la personne qui gère l&apos;hébergement du club.
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
};

export default DashboardHome;
