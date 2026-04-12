import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faCalendarAlt, faMapMarkerAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { palmaresApi } from '../../services/apiService';
import { useNotifications } from './NotificationSystem';
import ConfirmDialog from './ConfirmDialog';
import './ManagePalmares.scss';

const ManagePalmares = () => {
  const { success, error: notifyError } = useNotifications();
  const [palmares, setPalmares] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    category: 'Boxe Amateur',
    result: 'Champion',
    boxer: '',
    details: '',
    image: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resultOptions = ['Champion', 'Vainqueur', 'Médaillé d\'Argent', 'Médaillé de Bronze', 'Demi-finaliste', 'Quart de finaliste'];
  const categoryOptions = ['Boxe Amateur', 'Boxe Éducative', 'Handiboxe', 'Aeroboxe', 'Boxe Loisir'];

  useEffect(() => {
    loadPalmares();
  }, []);

  const loadPalmares = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await palmaresApi.list();
      setPalmares(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (err) {
      setError(err.message || 'Impossible de charger les palmarès.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await palmaresApi.update(editingItem.id, formData);
        success(`✅ Palmarès "${formData.title}" modifié avec succès !`);
      } else {
        await palmaresApi.create(formData);
        success(`🏆 Palmarès "${formData.title}" créé avec succès !`);
      }
      await loadPalmares();
      handleCloseModal();
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de l\'enregistrement du palmarès.';
      notifyError(`❌ ${errorMessage}`);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setDeleteTarget(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await palmaresApi.remove(deleteTarget);
      success('🗑️ Palmarès supprimé avec succès');
      await loadPalmares();
    } catch (err) {
      notifyError(err.message || 'Erreur lors de la suppression du palmarès.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      location: '',
      category: 'Boxe Amateur',
      result: 'Champion',
      boxer: '',
      details: '',
      image: ''
    });
  };

  return (
    <div className="manage-palmares">
      <div className="page-header">
        <h2>Gestion des Palmarès</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <FontAwesomeIcon icon={faPlus} />
          Ajouter un palmarès
        </button>
      </div>

      <div className="palmares-list">
        {loading && (
          <div className="empty-state">
            <p>Chargement des palmarès...</p>
          </div>
        )}
        {error && !loading && (
          <div className="empty-state">
            <p>{error}</p>
          </div>
        )}
        {!loading && !error && (
          <>
            {palmares.length === 0 ? (
              <div className="empty-state">
                <p>Aucun palmarès pour le moment.</p>
              </div>
            ) : (
              palmares.map((item, index) => (
                <motion.div
                  key={item.id}
                  className="palmares-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="palmares-content">
                    <div className="result-badge" style={{
                      background: item.result === 'Champion' || item.result === 'Vainqueur' ? 'var(--primary-red)' :
                                  item.result.includes('Argent') ? 'var(--secondary-light)' :
                                  item.result.includes('Bronze') ? 'var(--secondary-dark)' : 'var(--primary-red-dark)'
                    }}>
                      {item.result}
                    </div>
                    <h3>{item.title}</h3>
                    <div className="palmares-meta">
                      <span><FontAwesomeIcon icon={faCalendarAlt} /> {new Date(item.date).toLocaleDateString('fr-FR')}</span>
                      <span><FontAwesomeIcon icon={faMapMarkerAlt} /> {item.location}</span>
                      <span><FontAwesomeIcon icon={faUser} /> {item.boxer}</span>
                    </div>
                    <p className="category">{item.category}</p>
                    <p className="details">{item.details}</p>
                    <div className="palmares-actions">
                      <button className="btn-edit" onClick={() => handleEdit(item)}>
                        <FontAwesomeIcon icon={faEdit} /> Modifier
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(item.id)}>
                        <FontAwesomeIcon icon={faTrash} /> Supprimer
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <motion.div className="modal-content" onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3>{editingItem ? 'Modifier' : 'Ajouter'} un palmarès</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Titre *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Lieu *</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Catégorie *</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required>
                    {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Résultat *</label>
                  <select value={formData.result} onChange={(e) => setFormData({ ...formData, result: e.target.value })} required>
                    {resultOptions.map(res => <option key={res} value={res}>{res}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Boxeur / Équipe *</label>
                <input type="text" value={formData.boxer} onChange={(e) => setFormData({ ...formData, boxer: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Détails *</label>
                <textarea value={formData.details} onChange={(e) => setFormData({ ...formData, details: e.target.value })} rows="4" required />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>Annuler</button>
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={!formData.title || !formData.date || !formData.boxer || !formData.details}
                  style={{ 
                    opacity: (!formData.title || !formData.date || !formData.boxer || !formData.details) ? 0.5 : 1,
                    cursor: (!formData.title || !formData.date || !formData.boxer || !formData.details) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {editingItem ? '💾 Modifier' : '🏆 Créer le palmarès'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Supprimer le palmarès"
        message="Êtes-vous sûr de vouloir supprimer ce palmarès ? Cette action est irréversible."
        type="danger"
        confirmText="Supprimer"
        danger={true}
      />
    </div>
  );
};

export default ManagePalmares;

