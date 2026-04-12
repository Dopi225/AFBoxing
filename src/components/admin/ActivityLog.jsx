import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHistory,
  faUser,
  faClock,
  faTrash,
  faEdit,
  faPlus,
  faEye,
  faCheckCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { useNotifications } from './NotificationSystem';
import AdvancedFilters from './AdvancedFilters';
import { activityLogApi } from '../../services/apiService';
import './ActivityLog.scss';

const getActionIcon = (action) => { 
  const icons = {
    create: faPlus,
    update: faEdit,
    delete: faTrash,
    view: faEye,
    login: faCheckCircle,
    logout: faTimesCircle
  };
  return icons[action] || faEdit;
};

const getActionLabel = (action) => {
  const labels = {
    create: 'Création',
    update: 'Modification',
    delete: 'Suppression',
    view: 'Consultation',
    login: 'Connexion',
    logout: 'Déconnexion'
  };
  return labels[action] || action;
};

const getEntityLabel = (entity) => {
  const labels = {
    news: 'Actualité',
    palmares: 'Palmarès',
    gallery: 'Galerie',
    contact: 'Contact',
    schedule: 'Planning',
    activity: 'Activité',
    settings: 'Paramètres',
    user: 'Utilisateur',
    auth: 'Authentification'
  };
  return labels[entity] || entity;
};

const ActivityLog = () => {
  const { info, error: notifyError } = useNotifications();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    entity: '',
    action: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.entity) params.entity = filters.entity;
      if (filters.action) params.action = filters.action;
      if (filters.dateFrom) params.from = filters.dateFrom;
      if (filters.dateTo) params.to = filters.dateTo;
      if (filters.search) params.limit = 1000; // Plus de résultats si recherche
      
      const items = await activityLogApi.list(params);
      setLogs(items);
    } catch {
      notifyError('Erreur lors du chargement de l\'historique');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = React.useMemo(() => {
    let filtered = [...logs];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(log =>
        log.user?.toLowerCase().includes(searchLower) ||
        log.entity?.toLowerCase().includes(searchLower) ||
        log.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.entity) {
      filtered = filtered.filter(log => log.entity === filters.entity);
    }

    if (filters.action) {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= new Date(filters.dateFrom);
      });
    }

    if (filters.dateTo) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59);
        return logDate <= toDate;
      });
    }

    filtered.sort((a, b) => {
      const aDate = new Date(a.timestamp);
      const bDate = new Date(b.timestamp);
      return filters.sortOrder === 'asc' 
        ? aDate - bDate 
        : bDate - aDate;
    });

    return filtered;
  }, [logs, filters]);

  const clearLogs = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ? Cette action est irréversible.')) {
      try {
        await activityLogApi.clear();
        setLogs([]);
        info('Historique effacé');
      } catch {
        notifyError('Erreur lors de l\'effacement de l\'historique');
      }
    }
  };

  const entities = [...new Set(logs.map(log => log.entity))];

  if (loading) {
    return (
      <div className="activity-log">
        <div className="empty-state">
          <p>Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-log">
      <div className="page-header">
        <div>
          <h2>Historique des actions</h2>
          <p className="page-subtitle">Traçabilité complète de toutes les actions administrateur</p>
        </div>
        <div className="header-actions">
          {logs.length > 0 && (
            <button className="btn-secondary" onClick={clearLogs}>
              <FontAwesomeIcon icon={faTrash} />
              Effacer l'historique
            </button>
          )}
        </div>
      </div>

      <AdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableCategories={entities}
        showDateRange={true}
        showCategory={true}
        showSearch={true}
      />

      {filteredLogs.length === 0 ? (
        <div className="empty-state">
          <FontAwesomeIcon icon={faHistory} size="3x" />
          <p>{logs.length === 0 ? 'Aucun historique pour le moment.' : 'Aucun résultat avec les filtres sélectionnés.'}</p>
        </div>
      ) : (
        <div className="logs-list">
          {filteredLogs.map((log, index) => (
            <div
              key={log.id || index}
              className="log-item"
            >
              <div className="log-icon">
                <FontAwesomeIcon icon={getActionIcon(log.action)} />
              </div>
              <div className="log-content">
                <div className="log-header">
                  <span className="log-action">{getActionLabel(log.action)}</span>
                  <span className="log-entity">{getEntityLabel(log.entity)}</span>
                </div>
                <p className="log-description">{log.description || 'Action effectuée'}</p>
                <div className="log-meta">
                  <span className="log-user">
                    <FontAwesomeIcon icon={faUser} />
                    {log.user || 'Admin'}
                  </span>
                  <span className="log-time">
                    <FontAwesomeIcon icon={faClock} />
                    {new Date(log.timestamp).toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


export default ActivityLog;

