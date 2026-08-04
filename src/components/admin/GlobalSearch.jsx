import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faNewspaper, faTrophy, faImages, faEnvelope, faCalendarAlt, faFistRaised, faUserFriends } from '@fortawesome/free-solid-svg-icons';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { newsApi, palmaresApi, galleryApi, contactsApi, scheduleApi, activitiesApi, teamMembersApi } from '../../services/apiService';
import { useNotifications } from './NotificationSystem';
import { LoadingState } from '../PageStates';
import PageHeader from '../ui/PageHeader';
import { EmptyStateGuided } from './guided';
import { adminBreadcrumbs } from '../../utils/adminBreadcrumbs';
import { NAV_ITEMS } from '../../constants/adminCopy';
import { formatDateFR } from '../../utils/dateFormat';
import { textIncludes } from '../../utils/textSearch';
import './GlobalSearch.scss';

const GlobalSearch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { info, error: notifyError } = useNotifications();
  const query = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(query); 
  const [results, setResults] = useState({
    news: [],
    palmares: [],
    gallery: [],
    contacts: [],
    schedule: [],
    activities: [],
    team: []
  });
  const [loading, setLoading] = useState(false);
  const [partialError, setPartialError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [userRole, setUserRole] = useState('editor');

  useEffect(() => {
    let cancelled = false;
    import('../../services/apiService').then(({ authApi }) => {
      authApi.getMe().then((res) => {
        if (!cancelled && res?.user?.role) setUserRole(res.user.role);
      }).catch(() => {});
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (query) {
      setSearchTerm(query);
      performSearch(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const performSearch = async (term) => {
    if (!term.trim()) {
      setResults({
        news: [],
        palmares: [],
        gallery: [],
        contacts: [],
        schedule: [],
        activities: [],
        team: []
      });
      return;
    }

    setLoading(true);
    setPartialError('');

    try {
      const [news, palmares, gallery, contacts, schedule] = await Promise.all([
        newsApi.list().catch(() => []),
        palmaresApi.list().catch(() => []),
        galleryApi.list().catch(() => []),
        userRole === 'admin' ? contactsApi.list().catch(() => { setPartialError('Messages indisponibles.'); return []; }) : Promise.resolve([]),
        scheduleApi.list().catch(() => [])
      ]);

      // Charger les activités depuis l'API
      const activities = await activitiesApi.list().catch(() => []);
      const team = await teamMembersApi.list().catch(() => []);

      const match = (...fields) => fields.some((f) => textIncludes(f, term));

      const filteredResults = {
        news: news.filter((item) => match(item.title, item.summary, item.description)),
        palmares: palmares.filter((item) => match(item.title, item.boxer, item.location, item.details)),
        gallery: gallery.filter((item) => match(item.title, item.description, item.category)),
        contacts: contacts.filter((item) => match(item.name, item.email, item.message)),
        schedule: schedule.filter((item) => match(item.activity, item.day, item.level)),
        activities: activities.filter((item) =>
          match(item.title, item.subtitle, item.eyebrow) ||
          (item.sections || []).some((section) =>
            match(section.title) ||
            (section.paragraphs || []).some((p) => textIncludes(p, term)) ||
            (section.bullets || []).some((b) => textIncludes(b, term))
          )
        ),
        team: team.filter((item) =>
          match(item.fullName, item.role, item.bio, item.certifications)
        ),
      };

      setResults(filteredResults);
      const total = Object.values(filteredResults).reduce((sum, arr) => sum + arr.length, 0);
      if (total > 0) {
        info(`${total} résultat${total > 1 ? 's' : ''} trouvé${total > 1 ? 's' : ''}`);
      } else {
        info('Aucun résultat trouvé');
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Search error:', err);
      notifyError('La recherche a échoué. Vérifiez votre connexion et réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/admin/search?q=${encodeURIComponent(searchTerm)}`);
      performSearch(searchTerm);
    }
  };

  const allResults = [
    ...results.news.map(r => ({ ...r, type: 'news', icon: faNewspaper })),
    ...results.palmares.map(r => ({ ...r, type: 'palmares', icon: faTrophy })),
    ...results.gallery.map(r => ({ ...r, type: 'gallery', icon: faImages })),
    ...results.contacts.map(r => ({ ...r, type: 'contacts', icon: faEnvelope })),
    ...results.schedule.map(r => ({ ...r, type: 'schedule', icon: faCalendarAlt })),
    ...results.activities.map(r => ({ ...r, type: 'activities', icon: faFistRaised })),
    ...results.team.map(r => ({ ...r, title: r.fullName, type: 'team', icon: faUserFriends }))
  ];

  const tabs = [
    { id: 'all', label: 'Tout', count: allResults.length },
    { id: 'news', label: 'Actualités', count: results.news.length },
    { id: 'palmares', label: 'Palmarès', count: results.palmares.length },
    { id: 'gallery', label: 'Galerie', count: results.gallery.length },
    { id: 'contacts', label: 'Messages', count: results.contacts.length },
    { id: 'schedule', label: 'Planning', count: results.schedule.length },
    { id: 'activities', label: 'Activités', count: results.activities.length },
    { id: 'team', label: 'Équipe', count: results.team.length }
  ];

  const displayedResults = activeTab === 'all' 
    ? allResults 
    : results[activeTab]?.map(r => ({
        ...r,
        title: r.title || r.fullName,
        type: activeTab,
        icon: tabs.find(t => t.id === activeTab)?.icon
      })) || [];

  const getTypeLabel = (type) => {
    const labels = {
      news: 'Actualité',
      palmares: 'Palmarès',
      gallery: 'Galerie',
      contacts: 'Message reçu',
      schedule: 'Planning',
      activities: 'Activité',
      team: 'Équipe'
    };
    return labels[type] || type;
  };

  const handleResultClick = (result) => {
    const paths = {
      news: '/admin/news',
      palmares: '/admin/palmares',
      gallery: '/admin/gallery',
      contacts: '/admin/contacts',
      schedule: '/admin/schedule',
      activities: '/admin/activities',
      team: '/admin/team'
    };
    navigate(`${paths[result.type]}?highlight=${result.id}`);
  };

  return (
    <div className="global-search">
      <PageHeader
        title="Rechercher sur le site"
        subtitle="Trouvez rapidement une actualité, un message, une activité ou une photo."
        breadcrumbs={adminBreadcrumbs(NAV_ITEMS.search)}
      />
      <form onSubmit={handleSearch} className="search-form">
        {partialError ? <p className="admin-state--error" role="status">{partialError}</p> : null}
        <div className="search-input-wrapper">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher une actualité, un nom, une activité…"
            className="search-input"
            autoFocus
          />
        </div>
        <button type="submit" className="btn-search" disabled={loading}>
          {loading ? 'Recherche...' : 'Rechercher'}
        </button>
      </form>

      {query && (
        <>
          <div className="search-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`search-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {tab.count > 0 && <span className="tab-count">{tab.count}</span>}
              </button>
            ))}
          </div>

          <div className="search-results">
            {loading ? (
              <LoadingState label="Recherche en cours…" />
            ) : displayedResults.length === 0 ? (
              <EmptyStateGuided
                icon={faSearch}
                title="Aucun résultat"
                message={`Aucun élément ne correspond à « ${query} ». Essayez un autre mot-clé.`}
              />
            ) : (
              displayedResults.map((result, index) => (
                <motion.div
                  key={`${result.type}-${result.id}`}
                  className="search-result-item"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleResultClick(result)}
                >
                  <div className="result-icon">
                    <FontAwesomeIcon icon={result.icon} />
                  </div>
                  <div className="result-content">
                    <div className="result-header">
                      <span className="result-type">{getTypeLabel(result.type)}</span>
                      <h4>{result.title || result.name || result.activity || 'Sans titre'}</h4>
                    </div>
                    <p className="result-preview">
                      {result.summary || result.description || result.message || result.details || ''}
                    </p>
                    {result.date && (
                      <span className="result-date">
                        {formatDateFR(result.date)}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GlobalSearch;

