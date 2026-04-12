import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faImage } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { galleryApi, uploadApi } from '../../services/apiService';
import { useNotifications } from './NotificationSystem';
import ConfirmDialog from './ConfirmDialog';
import './ManageGallery.scss';

const ManageGallery = () => {
  const { success, error: notifyError } = useNotifications();
  const [gallery, setGallery] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Infrastructure',
    description: '',
    src: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);

  const categories = ['Infrastructure', 'Coaching', 'Compétition', 'Jeunesse', 'Loisir', 'Inclusion', 'Fitness', 'Bien-être', 'Social'];

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await galleryApi.list();
      // Adapter l'API (image -> src)
      setGallery(data.map(item => ({
        ...item,
        src: item.image
      })));
    } catch (err) {
      setError(err.message || 'Impossible de charger la galerie.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Vérifier qu'une image est fournie (fichier uploadé ou image existante)
    if (!file && !formData.src) {
      notifyError('Veuillez téléverser une image.');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      category: formData.category,
      description: formData.description?.trim() || null,
      image: formData.src || null
    };
    try {
      if (file) {
        setUploading(true);
        const result = await uploadApi.uploadImage('gallery', file);
        payload.image = result.url;
        setUploading(false);
      }

      if (editingItem) {
        await galleryApi.update(editingItem.id, payload);
        success(`✅ Image "${payload.title}" modifiée avec succès !`);
      } else {
        await galleryApi.create(payload);
        success(`📸 Image "${payload.title}" ajoutée avec succès !`);
      }
      await loadGallery();
      handleCloseModal();
      setFormData({
        title: '',
        category: 'Infrastructure',
        description: '',
        src: ''
      });
      setFile(null);
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de l\'enregistrement de l\'image.';
      notifyError(`❌ ${errorMessage}`);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      description: item.description || '',
      src: item.image || item.src || ''
    });
    setFile(null); // Réinitialiser le fichier pour permettre un nouveau upload
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setDeleteTarget(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await galleryApi.remove(deleteTarget);
      success('Image supprimée avec succès');
      await loadGallery();
    } catch (err) {
      notifyError(err.message || 'Erreur lors de la suppression de l\'image.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      title: '',
      category: 'Infrastructure',
      description: '',
      src: ''
    });
    setFile(null);
  };

  return (
    <div className="manage-gallery">
      <div className="page-header">
        <h2>Gestion de la Galerie</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <FontAwesomeIcon icon={faPlus} />
          Ajouter une image
        </button>
      </div>

      <div className="gallery-grid">
        {loading && (
          <div className="empty-state">
            <p>Chargement de la galerie...</p>
          </div>
        )}
        {error && !loading && (
          <div className="empty-state">
            <p>{error}</p>
          </div>
        )}
        {!loading && !error && (
          <>
            {gallery.length === 0 ? (
              <div className="empty-state">
                <p>Aucune image dans la galerie.</p>
              </div>
            ) : (
              gallery.map((item, index) => (
                <motion.div
                  key={item.id}
                  className="gallery-item"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="gallery-image">
                    {item.src ? (
                      <img src={item.src} alt={item.title} loading="lazy" />
                    ) : (
                      <div className="no-image">
                        <FontAwesomeIcon icon={faImage} />
                      </div>
                    )}
                    <div className="gallery-overlay">
                      <button className="btn-edit" onClick={() => handleEdit(item)}>
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(item.id)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                  <div className="gallery-info">
                    <h4>{item.title}</h4>
                    <span className="category">{item.category}</span>
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
            <h3>{editingItem ? 'Modifier' : 'Ajouter'} une image</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Titre *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Catégorie *</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="3" />
              </div>
              <div className="form-group">
                <label>Image *</label>
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
                        setFormData({ ...formData, src: event.target.result });
                      };
                      reader.readAsDataURL(selectedFile);
                    }
                  }}
                />
                {formData.src && (
                  <div className="image-preview" style={{ marginTop: '0.5rem' }}>
                    <img src={formData.src} alt="Preview" style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>Annuler</button>
                <button 
                  type="submit" 
                  className="btn-submit" 
                  disabled={uploading || !formData.title || !formData.category || (!file && !formData.src)}
                  style={{ 
                    opacity: (uploading || !formData.title || !formData.category || (!file && !formData.src)) ? 0.5 : 1,
                    cursor: (uploading || !formData.title || !formData.category || (!file && !formData.src)) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {uploading ? '📤 Téléversement...' : editingItem ? '💾 Modifier' : '📸 Ajouter l\'image'}
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
        title="Supprimer l'image"
        message="Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible."
        type="danger"
        confirmText="Supprimer"
        danger={true}
      />
    </div>
  );
};

export default ManageGallery;

