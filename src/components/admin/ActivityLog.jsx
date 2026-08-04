import React, { useState, useEffect, useMemo } from 'react';
import { useRequireAdmin } from '../../hooks/useRequireAdmin';
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
import { useAdminNotify } from '../../hooks/useAdminNotify';
import { humanizeAction, humanizeEntity, NAV_ITEMS } from '../../constants/adminCopy';
import { adminBreadcrumbs } from '../../utils/adminBreadcrumbs';
import ConfirmDialog from './ConfirmDialog';
import AdvancedFilters from './AdvancedFilters';
import PageHeader from '../ui/PageHeader';
import { EmptyStateGuided } from './guided';
import LoadMoreButton from '../ui/LoadMoreButton';
import { activityLogApi } from '../../services/apiService';
import { parseLocalDate, startOfLocalDay, endOfLocalDay } from '../../utils/dateFormat';
import { textIncludes } from '../../utils/textSearch';
import { LoadingState } from '../PageStates';
import './ActivityLog.scss';

const PAGE_SIZE = 50;

const DEFAULT_FILTERS = {
  search: '',
  entity: '',
  action: '',
  dateFrom: '',
  dateTo: '',
  sortBy: 'date',
  sortOrder: 'desc',
};

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

const getActionLabel = (action) => humanizeAction(action) || action;
const getEntityLabel = (entity) => humanizeEntity(entity) || entity;

const formatLogTimestamp = (value) => {
  const dt = parseLocalDate(value);
  return dt ? dt.toLocaleString('fr-FR') : '';
};

const ActivityLog = () => {
  const adminOk = useRequireAdmin();
  const { notifySuccess, notifyError } = useAdminNotify('activity-log');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });

  useEffect(() => {
    if (!adminOk) return;
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminOk, filters.entity, filters.action, filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.entity) params.entity = filters.entity;
      if (filters.action) params.action = filters.action;
      if (filters.dateFrom) params.from = filters.dateFrom;
      if (filters.dateTo) params.to = filters.dateTo;
      if (filters.search) params.limit = 1000;

      const items = await activityLogApi.list(params);
      setLogs(items);
    } catch (err) {
      notifyError(err, 'Impossible de charger l\'historique.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    let filtered = [...logs];

    if (filters.search) {
      filtered = filtered.filter((log) =>
        textIncludes(log.user, filters.search) ||
        textIncludes(log.entity, filters.search) ||
        textIncludes(log.description, filters.search)
      );
    }

    if (filters.entity) {
      filtered = filtered.filter(log => log.entity === filters.entity);
    }

    if (filters.action) {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    if (filters.dateFrom) {
      const from = startOfLocalDay(filters.dateFrom);
      if (from) {
        filtered = filtered.filter((log) => {
          const logDate = parseLocalDate(log.timestamp);
          return logDate && logDate >= from;
        });
      }
    }

    if (filters.dateTo) {
      const to = endOfLocalDay(filters.dateTo);
      if (to) {
        filtered = filtered.filter((log) => {
          const logDate = parseLocalDate(log.timestamp);
          return logDate && logDate <= to;
        });
      }
    }

    filtered.sort((a, b) => {
      const aDate = parseLocalDate(a.timestamp)?.getTime() ?? 0;
      const bDate = parseLocalDate(b.timestamp)?.getTime() ?? 0;
      return filters.sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
    });

    return filtered;
  }, [logs, filters]);

  const displayedLogs = filteredLogs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredLogs.length;

  const resetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
  };

  const clearLogs = async () => {
    try {
      await activityLogApi.clear();
      setLogs([]);
      notifySuccess('Historique effacé.');
    } catch (err) {
      notifyError(err, 'Impossible d\'effacer l\'historique.');
    } finally {
      setShowClearConfirm(false);
    }
  };

  if (!adminOk) {
    return (
      <div className="activity-log">
        <LoadingState label="Vérification des droits…" />
      </div>
    );
  }

  const entities = [...new Set(logs.map(log => log.entity))];
  const hasActiveFilters = Boolean(
    filters.search || filters.entity || filters.action || filters.dateFrom || filters.dateTo
  );

  if (loading) {
    return (
      <div className="activity-log">
        <LoadingState label="Chargement de l'historique…" />
      </div>
    );
  }

  return (
    <div className="activity-log">
      <PageHeader
        title="Historique des modifications"
        subtitle="Pour les responsables qui souhaitent suivre les changements effectués sur le site."
        breadcrumbs={adminBreadcrumbs(NAV_ITEMS.history)}
        actions={
          logs.length > 0 ? (
            <button type="button" className="btn btn-secondary" onClick={() => setShowClearConfirm(true)}>
              <FontAwesomeIcon icon={faTrash} />
              Effacer l&apos;historique
            </button>
          ) : null
        }
      />

      <AdvancedFilters
        filters={{ ...filters, category: filters.entity }}
        onFiltersChange={(f) => setFilters({ ...f, entity: f.category || '' })}
        availableCategories={entities.map((e) => ({ value: e, label: getEntityLabel(e) }))}
        showDateRange={true}
        showCategory={true}
        showSearch={true}
      />

      {filteredLogs.length === 0 ? (
        <EmptyStateGuided
          icon={faHistory}
          title={logs.length === 0 ? 'Aucun historique' : 'Aucun résultat'}
          message={
            logs.length === 0
              ? 'Les actions effectuées sur le site apparaîtront ici au fil du temps.'
              : 'Essayez d\'élargir vos filtres pour retrouver des entrées.'
          }
          actionLabel={logs.length > 0 && hasActiveFilters ? 'Réinitialiser les filtres' : undefined}
          onAction={logs.length > 0 && hasActiveFilters ? resetFilters : undefined}
        />
      ) : (
        <>
          <div className="logs-list">
            {displayedLogs.map((log, index) => (
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
                      {formatLogTimestamp(log.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <LoadMoreButton
            hasMore={hasMore}
            loading={false}
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            loadedCount={displayedLogs.length}
            total={filteredLogs.length}
          />
        </>
      )}

      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={clearLogs}
        title="Effacer tout l'historique ?"
        consequences={['Toutes les entrées seront supprimées définitivement.', 'Cette action ne peut pas être annulée.']}
        confirmText="Effacer"
        danger
      />
    </div>
  );
};


export default ActivityLog;
