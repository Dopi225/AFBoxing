import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faNewspaper, faTrophy, faImages, faEnvelope, faCalendarAlt, faFistRaised } from '@fortawesome/free-solid-svg-icons';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { newsApi, palmaresApi, galleryApi, contactsApi, scheduleApi, activitiesApi } from '../../services/apiService';
import { useNotifications } from './NotificationSystem';
import './GlobalSearch.scss';

const GlobalSearch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { info } = useNotifications();
  const query = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(query); 
  const [results, setResults] = useState({
    news: [],
    palmares: [],
    gallery: [],
    contacts: [],
    schedule: [],
    activities: []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

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
        activities: []
      });
      return;
    }

    setLoading(true);
    const lowerTerm = term.toLowerCase();

    try {
      const [news, palmares, gallery, contacts, schedule] = await Promise.all([
        newsApi.list().catch(() => []),
        palmaresApi.list().catch(() => []),
        galleryApi.list().catch(() => []),
        contactsApi.list().catch(() => []),
        scheduleApi.list().catch(() => [])
      ]);

      // Charger les activités depuis l'API
      const activities = await activitiesApi.list().catch(() => []);

      const filteredResults = {
        news: news.filter(item => 
          item.title?.toLowerCase().includes(lowerTerm) ||
          item.summary?.toLowerCase().includes(lowerTerm) ||
          item.description?.toLowerCase().includes(lowerTerm)
        ),
        palmares: palmares.filter(item =>
          item.title?.toLowerCase().includes(lowerTerm) ||
          item.boxer?.toLowerCase().includes(lowerTerm) ||
          item.location?.toLowerCase().includes(lowerTerm) ||
          item.details?.toLowerCase().includes(lowerTerm)
        ),
        gallery: gallery.filter(item =>
          item.title?.toLowerCase().includes(lowerTerm) ||
          item.description?.toLowerCase().includes(lowerTerm) ||
          item.category?.toLowerCase().includes(lowerTerm)
        ),
        contacts: contacts.filter(item =>
          item.name?.toLowerCase().includes(lowerTerm) ||
          item.email?.toLowerCase().includes(lowerTerm) ||
          item.message?.toLowerCase().includes(lowerTerm)
        ),
        schedule: schedule.filter(item =>
          item.activity?.toLowerCase().includes(lowerTerm) ||
          item.day?.toLowerCase().includes(lowerTerm) ||
          item.level?.toLowerCase().includes(lowerTerm)
        ),
        activities: activities.filter(item =>
          item.title?.toLowerCase().includes(lowerTerm) ||
          item.subtitle?.toLowerCase().includes(lowerTerm) ||
          item.eyebrow?.toLowerCase().includes(lowerTerm) ||
          (item.sections || []).some(section =>
            section.title?.toLowerCase().includes(lowerTerm) ||
            (section.paragraphs || []).some(p => p.toLowerCase().includes(lowerTerm)) ||
            (section.bullets || []).some(b => b.toLowerCase().includes(lowerTerm))
          )
        )
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
    ...results.activities.map(r => ({ ...r, type: 'activities', icon: faFistRaised }))
  ];

  const tabs = [
    { id: 'all', label: 'Tout', count: allResults.length },
    { id: 'news', label: 'Actualités', count: results.news.length },
    { id: 'palmares', label: 'Palmarès', count: results.palmares.length },
    { id: 'gallery', label: 'Galerie', count: results.gallery.length },
    { id: 'contacts', label: 'Contacts', count: results.contacts.length },
    { id: 'schedule', label: 'Planning', count: results.schedule.length },
    { id: 'activities', label: 'Activités', count: results.activities.length }
  ];

  const displayedResults = activeTab === 'all' 
    ? allResults 
    : results[activeTab]?.map(r => ({ ...r, type: activeTab, icon: tabs.find(t => t.id === activeTab)?.icon })) || [];

  const getTypeLabel = (type) => {
    const labels = {
      news: 'Actualité',
      palmares: 'Palmarès',
      gallery: 'Galerie',
      contacts: 'Contact',
      schedule: 'Planning',
      activities: 'Activité'
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
      activities: '/admin/activities'
    };
    navigate(paths[result.type]);
  };

  return (
    <div className="global-search">
      <div className="search-header">
        <h2>Recherche globale</h2>
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher dans tous les contenus..."
              className="search-input"
              autoFocus
            />
          </div>
          <button type="submit" className="btn-search" disabled={loading}>
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </form>
      </div>

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
              <div className="empty-state">
                <p>Recherche en cours...</p>
              </div>
            ) : displayedResults.length === 0 ? (
              <div className="empty-state">
                <p>Aucun résultat pour "{query}"</p>
              </div>
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
                        {new Date(result.date).toLocaleDateString('fr-FR')}
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

