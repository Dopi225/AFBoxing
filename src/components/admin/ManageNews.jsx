import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, 
  faEdit,
  faTrash,
  faCalendarAlt,
  faImage,
  faCheckSquare,
  faSquare
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { newsApi, uploadApi } from '../../services/apiService';
import { useNotifications } from './NotificationSystem';
import ConfirmDialog from './ConfirmDialog';
import AdvancedFilters from './AdvancedFilters';
import './ManageNews.scss';

const ManageNews = () => {
  const { success, error: notifyError } = useNotifications();
  const [news, setNews] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    summary: '',
    description: '',
    image: ''
  });

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    setError('');
    try {
      const items = await newsApi.list();
      setNews(items);
    } catch (err) {
      setError(err.message || 'Impossible de charger les actualités.');
    } finally {
      setLoading(false);
    }
  };

  const filteredNews = useMemo(() => {
    let filtered = [...news];

    // Recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(searchLower) ||
        item.summary?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par date
    if (filters.dateFrom) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date || item.created_at);
        return itemDate >= new Date(filters.dateFrom);
      });
    }
    if (filters.dateTo) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date || item.created_at);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59);
        return itemDate <= toDate;
      });
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      if (filters.sortBy === 'date') {
        aValue = new Date(a.date || a.created_at);
        bValue = new Date(b.date || b.created_at);
      } else if (filters.sortBy === 'title') {
        aValue = (a.title || '').toLowerCase();
        bValue = (b.title || '').toLowerCase();
      } else {
        aValue = new Date(a.created_at || a.date);
        bValue = new Date(b.created_at || b.date);
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [news, filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };

      if (file) {
        setUploading(true);
        const result = await uploadApi.uploadImage('news', file);
        payload.image = result.url;
        setUploading(false);
      }

      if (editingNews) {
        await newsApi.update(editingNews.id, payload);
        success(`✅ Actualité "${payload.title}" modifiée avec succès !`);
      } else {
        await newsApi.create(payload);
        success(`🎉 Actualité "${payload.title}" créée avec succès !`);
      }
      await loadNews();
      handleCloseModal();
      setFormData({
        title: '',
        date: new Date().toISOString().split('T')[0],
        summary: '',
        description: '',
        image: ''
      });
      setFile(null);
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de l\'enregistrement de l\'actualité.';
      notifyError(`❌ ${errorMessage}`);
    }
  };

  const handleEdit = (item) => {
    setEditingNews(item);
    setFormData({
      title: item.title,
      date: item.date,
      summary: item.summary,
      description: item.description,
      image: item.image || ''
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setDeleteTarget(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await newsApi.remove(deleteTarget);
      success('🗑️ Actualité supprimée avec succès');
      await loadNews();
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(deleteTarget);
        return newSet;
      });
    } catch (err) {
      notifyError(err.message || 'Erreur lors de la suppression.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.size === 0) return;
    setDeleteTarget(Array.from(selectedItems));
    setShowDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    if (!deleteTarget || !Array.isArray(deleteTarget)) return;
    try {
      await Promise.all(deleteTarget.map(id => newsApi.remove(id)));
      success(`${deleteTarget.length} actualité${deleteTarget.length > 1 ? 's' : ''} supprimée${deleteTarget.length > 1 ? 's' : ''} avec succès`);
      await loadNews();
      setSelectedItems(new Set());
    } catch (err) {
      notifyError(err.message || 'Erreur lors de la suppression.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const toggleSelect = (id) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    const filteredIds = filteredNews.map(n => n.id);
    const allSelected = filteredIds.every(id => selectedItems.has(id));
    if (allSelected) {
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        filteredIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    } else {
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        filteredIds.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingNews(null);
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      summary: '',
      description: '',
      image: ''
    });
    setFile(null);
  };

  const handleAddNew = () => {
    setEditingNews(null);
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      summary: '',
      description: '',
      image: ''
    });
    setFile(null);
    setShowModal(true);
  };

  return (
    <div className="manage-news">
      <div className="page-header">
        <div>
          <h2>Gestion des Actualités</h2>
          {selectedItems.size > 0 && (
            <p className="selection-info">
              {selectedItems.size} élément{selectedItems.size > 1 ? 's' : ''} sélectionné{selectedItems.size > 1 ? 's' : ''}
            </p>
          )}
          {filteredNews.length !== news.length && (
            <p className="filter-info">
              {filteredNews.length} résultat{filteredNews.length > 1 ? 's' : ''} sur {news.length}
            </p>
          )}
        </div>
        <div className="header-actions">
          {selectedItems.size > 0 && (
            <button className="btn-danger" onClick={handleBulkDelete}>
              <FontAwesomeIcon icon={faTrash} />
              Supprimer ({selectedItems.size})
            </button>
          )}
          <button className="btn-primary" onClick={handleAddNew}>
            <FontAwesomeIcon icon={faPlus} />
            Ajouter une actualité
          </button>
        </div>
      </div>

      <AdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        showDateRange={true}
        showCategory={false}
        showSearch={true}
      />

      <div className="news-list">
        {loading && (
          <div className="admin-state--loading" role="status" aria-live="polite">
            <span className="admin-state__spinner" aria-hidden />
            <p>Chargement des actualités…</p>
          </div>
        )}
        {error && !loading && (
          <div className="admin-state--error" role="alert">
            {error}
          </div>
        )}
        {!loading && !error && (
          <>
            {filteredNews.length === 0 ? (
              <div className="admin-state--empty">
                <p>
                  {news.length === 0
                    ? 'Aucune actualité pour le moment. Utilisez « Ajouter une actualité » pour publier.'
                    : 'Aucun résultat avec les filtres sélectionnés. Modifiez la recherche ou les dates.'}
                </p>
              </div>
            ) : (
              <>
                {filteredNews.length > 0 && (
                  <div className="bulk-select-header">
                    <button
                      className="select-all-btn"
                      onClick={toggleSelectAll}
                      title={selectedItems.size === filteredNews.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    >
                      <FontAwesomeIcon icon={selectedItems.size === filteredNews.length ? faCheckSquare : faSquare} />
                      <span>{selectedItems.size === filteredNews.length ? 'Tout désélectionner' : 'Tout sélectionner'}</span>
                    </button>
                  </div>
                )}
                {filteredNews.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className={`news-card ${selectedItems.has(item.id) ? 'selected' : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="news-select">
                      <button
                        className="select-checkbox"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(item.id);
                        }}
                      >
                        <FontAwesomeIcon icon={selectedItems.has(item.id) ? faCheckSquare : faSquare} />
                      </button>
                    </div>
                    <div className="news-image">
                    {item.image ? (
                      <img src={item.image} alt={item.title} loading="lazy" />
                    ) : (
                      <div className="no-image">
                        <FontAwesomeIcon icon={faImage} />
                      </div>
                    )}
                  </div>
                  <div className="news-content">
                    <h3>{item.title}</h3>
                    <div className="news-meta">
                      <span>
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        {new Date(item.date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <p className="summary">{item.summary}</p>
                    <div className="news-actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(item)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                        Modifier
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(item.id)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                        Supprimer
                      </button>
                    </div>
                  </div>
                  </motion.div>
                ))}
              </>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onConfirm={Array.isArray(deleteTarget) ? confirmBulkDelete : confirmDelete}
        title={Array.isArray(deleteTarget) ? 'Supprimer plusieurs actualités' : 'Supprimer l\'actualité'}
        message={Array.isArray(deleteTarget) 
          ? `Êtes-vous sûr de vouloir supprimer ${deleteTarget.length} actualité${deleteTarget.length > 1 ? 's' : ''} ? Cette action est irréversible.`
          : 'Êtes-vous sûr de vouloir supprimer cette actualité ? Cette action est irréversible.'}
        type="danger"
        confirmText="Supprimer"
        danger={true}
      />

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <motion.div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3>{editingNews ? 'Modifier' : 'Ajouter'} une actualité</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Titre *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Résumé *</label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  rows="2"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  required
                />
              </div>

              <div className="form-group">
                <label>Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0] || null;
                    setFile(selectedFile);
                    // Prévisualisation immédiate si fichier sélectionné
                    if (selectedFile) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setFormData({ ...formData, image: event.target.result });
                      };
                      reader.readAsDataURL(selectedFile);
                    }
                  }}
                />
                {formData.image && (
                  <div className="image-preview" style={{ marginTop: '0.5rem' }}>
                    <img src={formData.image} alt="Preview" style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="btn-submit" 
                  disabled={uploading || !formData.title || !formData.date || !formData.summary || !formData.description}
                  style={{ 
                    opacity: (uploading || !formData.title || !formData.date || !formData.summary || !formData.description) ? 0.5 : 1,
                    cursor: (uploading || !formData.title || !formData.date || !formData.summary || !formData.description) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {uploading
                    ? '📤 Téléversement...'
                    : editingNews
                      ? '💾 Modifier'
                      : '✨ Créer l\'actualité'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ManageNews;

