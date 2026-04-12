import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faSave,
  faEye,
  faFilter,
  faFistRaised,
  faGraduationCap
} from '@fortawesome/free-solid-svg-icons';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from './NotificationSystem';
import ConfirmDialog from './ConfirmDialog';
import { activitiesApi } from '../../services/apiService';
import { logActivity } from '../../utils/activityLogger';
import './ManageActivities.scss';

// const defaultActivities = [
//   {
//     id: 'educative',
//     kind: 'boxing',
//     title: 'Boxe éducative',
//     eyebrow: '8–17 ans • Technique • Valeurs',
//     subtitle: 'Une pratique sécurisée, sans recherche de KO : apprentissage, confiance en soi et cadre éducatif.',
//     scheduleActivityName: 'Boxe Éducative',
//     meta: {
//       age: '8–17 ans',
//       equipment: 'Tenue de sport, chaussures propres. Gants prêtés au club.',
//       priceKey: 'boxing.educative'
//     },
//     sections: [
//       {
//         title: 'Ce que c\'est',
//         paragraphs: ['La boxe éducative permet aux jeunes de découvrir la boxe anglaise dans un cadre progressif. On travaille la posture, les déplacements, la coordination et la maîtrise de soi, avec des mises en situation adaptées (sans brutalité).']
//       },
//       {
//         title: 'Ce qu\'on travaille',
//         bullets: [
//           'Coordination, équilibre et motricité',
//           'Techniques de base (garde, direct, crochet, esquive)',
//           'Respect des règles et de l\'adversaire',
//           'Confiance, discipline, gestion des émotions'
//         ]
//       },
//       {
//         title: 'Pour qui ?',
//         paragraphs: ['Pour les jeunes débutants ou déjà sportifs. Les groupes sont organisés pour garantir un encadrement adapté à l\'âge et au niveau.']
//       }
//     ],
//     icon: 'faGraduationCap',
//     image: '',
//     enabled: true
//   }
// ];


const CATEGORIES = {
  boxing: { label: 'Boxe', icon: faFistRaised, color: 'var(--primary-red)' },
  social: { label: 'Socio-éducatif', icon: faGraduationCap, color: 'var(--secondary-dark)' }
};

const ManageActivities = () => {
  const { success, error: notifyError } = useNotifications();
  const [activities, setActivities] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [previewActivity, setPreviewActivity] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState({
    id: '',
    kind: 'boxing',
    title: '',
    eyebrow: '',
    subtitle: '',
    scheduleActivityName: '',
    meta: {
      age: '',
      equipment: '',
      priceKey: ''
    },
    sections: [],
    icon: 'faGraduationCap',
    image: '',
    enabled: true
  });

  useEffect(() => {
    loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const items = await activitiesApi.list();
      setActivities(items);
    } catch {
      notifyError('Erreur lors du chargement des activités');
      // setActivities(defaultActivities);
    } finally {
      setLoading(false);
    }
  };

  const saveActivities = async () => {
    // Les activités sont sauvegardées individuellement lors de create/update
    success('Toutes les activités sont synchronisées avec la base de données');
  };

  const handleAddNew = () => {
    setEditingActivity(null);
    setFormData({
      id: '',
      kind: 'boxing',
      title: '',
      eyebrow: '',
      subtitle: '',
      scheduleActivityName: '',
      meta: {
        age: '',
        equipment: '',
        priceKey: ''
      },
      sections: [],
      icon: 'faGraduationCap',
      image: '',
      enabled: true
    });
    setShowModal(true);
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setFormData({ ...activity });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setDeleteTarget(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await activitiesApi.remove(deleteTarget);
      logActivity('delete', 'activity', `Activité supprimée (ID: ${deleteTarget})`);
      success('Activité supprimée avec succès');
      await loadActivities();
    } catch (err) {
      notifyError(err.message || 'Erreur lors de la suppression');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handlePreview = (activity) => {
    setPreviewActivity(activity);
    setShowPreview(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation visuelle
    if (!formData.title || !formData.title.trim()) {
      notifyError('Le titre est obligatoire');
      return;
    }
    
    if (!formData.subtitle || !formData.subtitle.trim()) {
      notifyError('La description est obligatoire');
      return;
    }
    
    // Génération automatique de l'ID si vide
    const activityId = formData.id || formData.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const price = formData.meta.priceKey || formData.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Préparation des données pour l'API
    const newActivity = {
      id: activityId,
      kind: formData.kind || 'boxing',
      title: formData.title.trim(),
      eyebrow: formData.eyebrow?.trim() || null,
      subtitle: formData.subtitle.trim(),
      scheduleActivityName: formData.scheduleActivityName?.trim() || null,
      meta: {
        age: formData.meta?.age?.trim() || null,
        equipment: formData.meta?.equipment?.trim() || null,
        priceKey: price|| null
      },
      sections: formData.sections || [],
      icon: formData.icon || null,
      image: formData.image || null,
      enabled: formData.enabled !== false
    };

    try {
      if (editingActivity) {
        await activitiesApi.update(editingActivity.id, newActivity);
        logActivity('update', 'activity', `Activité "${newActivity.title}" modifiée`);
        success(`✅ Activité "${newActivity.title}" modifiée avec succès !`);
      } else {
        await activitiesApi.create(newActivity);
        logActivity('create', 'activity', `Activité "${newActivity.title}" créée`);
        success(`🎉 Activité "${newActivity.title}" créée avec succès !`);
      }
      
      await loadActivities();
      setShowModal(false);
      setEditingActivity(null);
      setFormData({
        id: '',
        kind: 'boxing',
        title: '',
        eyebrow: '',
        subtitle: '',
        scheduleActivityName: '',
        meta: {
          age: '',
          equipment: '',
          priceKey: ''
        },
        sections: [],
        icon: 'faGraduationCap',
        image: '',
        enabled: true
      });
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de la sauvegarde';
      if (errorMessage.includes('errors')) {
        try {
          const errorData = JSON.parse(errorMessage);
          if (errorData.errors) {
            const errorList = Object.entries(errorData.errors).map(([field, msg]) => `${field}: ${msg}`).join('\n');
            notifyError(`Erreurs de validation :\n${errorList}`);
            return;
          }
        } catch {
          // Pas un JSON, on affiche tel quel
        }
      }
      notifyError(`❌ ${errorMessage}`);
    }
  };

  const addSection = () => {
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, { title: '', paragraphs: [], bullets: [] }]
    }));
  };

  const updateSection = (index, field, value) => {
    setFormData(prev => {
      const newSections = [...prev.sections];
      newSections[index] = { ...newSections[index], [field]: value };
      return { ...prev, sections: newSections };
    });
  };

  const removeSection = (index) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  };

  const toggleActivity = async (id) => {
    try {
      const activity = activities.find(a => a.id === id);
      if (!activity) return;
      
      const updated = { ...activity, enabled: !activity.enabled };
      await activitiesApi.update(id, updated);
      logActivity('update', 'activity', `Activité "${activity.title}" ${updated.enabled ? 'activée' : 'désactivée'}`);
      success('Statut de l\'activité mis à jour');
      await loadActivities();
    } catch (err) {
      notifyError(err.message || 'Erreur lors de la mise à jour');
    }
  };

  const filteredActivities = selectedCategory === 'all' 
    ? activities 
    : activities.filter(a => a.kind === selectedCategory);

  const activitiesByCategory = {
    boxing: activities.filter(a => a.kind === 'boxing'),
    social: activities.filter(a => a.kind === 'social')
  };

  if (loading) {
    return (
      <div className="manage-activities">
        <div className="empty-state">
          <p>Chargement des activités...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-activities">
      <div className="page-header">
        <div>
          <h2>Gestion des Activités</h2>
          <p className="page-subtitle">Gérez les activités du club (Boxe Éducative, Loisir, etc.)</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={saveActivities}>
            <FontAwesomeIcon icon={faSave} />
            Synchroniser
          </button>
          <button className="btn-primary" onClick={handleAddNew}>
            <FontAwesomeIcon icon={faPlus} />
            Ajouter une activité
          </button>
        </div>
      </div>

      {/* Filtres par catégorie */}
      <div className="category-filters">
        <button
          className={`category-filter ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          <FontAwesomeIcon icon={faFilter} />
          <span>Toutes ({activities.length})</span>
        </button>
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <button
            key={key}
            className={`category-filter ${selectedCategory === key ? 'active' : ''}`}
            onClick={() => setSelectedCategory(key)}
            style={{ '--category-color': cat.color }}
          >
            <FontAwesomeIcon icon={cat.icon} />
            <span>{cat.label} ({activitiesByCategory[key]?.length || 0})</span>
          </button>
        ))}
      </div>

      <div className="activities-list">
        {filteredActivities.length === 0 ? (
          <div className="empty-state">
            <p>
              {activities.length === 0 
                ? 'Aucune activité pour le moment.' 
                : `Aucune activité dans la catégorie "${CATEGORIES[selectedCategory]?.label || selectedCategory}".`}
            </p>
          </div>
        ) : (
          filteredActivities.map((activity, index) => {
            const category = CATEGORIES[activity.kind] || CATEGORIES.boxing;
            return (
              <motion.div
                key={activity.id}
                className={`activity-card ${!activity.enabled ? 'disabled' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
              <div className="activity-header">
                <div className="activity-info">
                  <div className="activity-status">
                    <button
                      className={`status-toggle ${activity.enabled ? 'enabled' : 'disabled'}`}
                      onClick={() => toggleActivity(activity.id)}
                      title={activity.enabled ? 'Désactiver' : 'Activer'}
                    >
                      {activity.enabled ? '✓' : '✗'}
                    </button>
                  </div>
                  <div>
                    <div className="activity-category-badge" style={{ '--category-color': category.color }}>
                      <FontAwesomeIcon icon={category.icon} />
                      <span>{category.label}</span>
                    </div>
                    <h3>{activity.title}</h3>
                    <p className="activity-eyebrow">{activity.eyebrow}</p>
                    <p className="activity-subtitle">{activity.subtitle}</p>
                  </div>
                </div>
                <div className="activity-actions">
                  <button
                    className="btn-icon"
                    onClick={() => handlePreview(activity)}
                    title="Prévisualiser"
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleEdit(activity)}
                    title="Modifier"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => handleDelete(activity.id)}
                    title="Supprimer"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
              <div className="activity-meta">
                <span><strong>ID:</strong> {activity.id}</span>
                <span><strong>Type:</strong> {activity.kind}</span>
                <span><strong>Sections:</strong> {activity.sections?.length || 0}</span>
              </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal d'édition */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div
              className="modal-content modal-large"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3>{editingActivity ? 'Modifier' : 'Ajouter'} une activité</h3>
              <form onSubmit={handleSubmit} className="activity-form">
                <div className="form-row">
                  {/* <div className="form-group">
                    <label>
                      ID unique *
                      {!editingActivity && (
                        <span className="form-hint" style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'normal' }}>
                          (Généré automatiquement si vide)
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      placeholder={editingActivity ? "Non modifiable" : "educative (généré automatiquement)"}
                      required
                      disabled={!!editingActivity}
                      style={{ opacity: editingActivity ? 0.6 : 1 }}
                    />
                  </div> */}
                  <div className="form-group">
                    <label>
                      <FontAwesomeIcon icon={faFilter} />
                      Catégorie
                    </label>
                    <select
                      value={formData.kind}
                      onChange={(e) => setFormData({ ...formData, kind: e.target.value })}
                    >
                      {Object.entries(CATEGORIES).map(([key, cat]) => (
                        <option key={key} value={key}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <div className="form-hint">
                      Catégorie de l'activité : {CATEGORIES[formData.kind]?.label || 'Non définie'}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    Titre *
                    <span className="form-hint" style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                      (Ex: "Boxe Éducative")
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Boxe Éducative"
                    required
                    style={{ borderColor: formData.title ? '#4caf50' : undefined }}
                  />
                  {formData.title && (
                    <div style={{ fontSize: '0.75rem', color: '#4caf50', marginTop: '0.25rem' }}>
                      ✓ {formData.title.length} caractères
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Eyebrow (sous-titre court)</label>
                  <input
                    type="text"
                    value={formData.eyebrow}
                    onChange={(e) => setFormData({ ...formData, eyebrow: e.target.value })}
                    placeholder="8–17 ans • Technique • Valeurs"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Description *
                    <span className="form-hint" style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                      (Texte visible sur la page d'accueil)
                    </span>
                  </label>
                  <textarea
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    rows="3"
                    placeholder="Une description courte et accrocheuse de l'activité..."
                    required
                    style={{ borderColor: formData.subtitle ? '#4caf50' : undefined }}
                  />
                  {formData.subtitle && (
                    <div style={{ fontSize: '0.75rem', color: '#4caf50', marginTop: '0.25rem' }}>
                      ✓ {formData.subtitle.length} caractères
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Nom pour le planning</label>
                  <input
                    type="text"
                    value={formData.scheduleActivityName}
                    onChange={(e) => setFormData({ ...formData, scheduleActivityName: e.target.value })}
                    placeholder="Boxe Éducative"
                  />
                </div>

                <div className="form-section">
                  <h4>Métadonnées</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Âge</label>
                      <input
                        type="text"
                        value={formData.meta.age}
                        onChange={(e) => setFormData({
                          ...formData,
                          meta: { ...formData.meta, age: e.target.value }
                        })}
                        placeholder="8–17 ans"
                      />
                    </div>
                    <div className="form-group">
                      <label>Équipement</label>
                      <input
                        type="text"
                        value={formData.meta.equipment}
                        onChange={(e) => setFormData({
                          ...formData,
                          meta: { ...formData.meta, equipment: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  {/* <div className="form-group">
                    <label>Clé de prix</label>
                    <input
                      type="text"
                      value={formData.meta.priceKey}
                      onChange={(e) => setFormData({
                        ...formData,
                        meta: { ...formData.meta, priceKey: e.target.value }
                      })}
                      placeholder="boxing.educative"
                    />
                  </div> */}
                </div>

                <div className="form-section">
                  <div className="section-header-form">
                    <h4>Sections de contenu</h4>
                    <button type="button" className="btn-add-section" onClick={addSection}>
                      <FontAwesomeIcon icon={faPlus} />
                      Ajouter une section
                    </button>
                  </div>
                  {formData.sections.map((section, idx) => (
                    <div key={idx} className="section-editor">
                      <div className="section-header">
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => updateSection(idx, 'title', e.target.value)}
                          placeholder="Titre de la section"
                          className="section-title-input"
                        />
                        <button
                          type="button"
                          className="btn-remove-section"
                          onClick={() => removeSection(idx)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                      <div className="section-content">
                        <div className="form-group">
                          <label>Paragraphes (un par ligne)</label>
                          <textarea
                            value={(section.paragraphs || []).join('\n')}
                            onChange={(e) => updateSection(idx, 'paragraphs', e.target.value.split('\n').filter(p => p.trim()))}
                            rows="3"
                            placeholder="Paragraphe 1&#10;Paragraphe 2"
                          />
                        </div>
                        <div className="form-group">
                          <label>Points à puces (un par ligne)</label>
                          <textarea
                            value={(section.bullets || []).join('\n')}
                            onChange={(e) => updateSection(idx, 'bullets', e.target.value.split('\n').filter(b => b.trim()))}
                            rows="3"
                            placeholder="Point 1&#10;Point 2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="btn-submit"
                    disabled={!formData.title || !formData.subtitle}
                    style={{ 
                      opacity: (!formData.title || !formData.subtitle) ? 0.5 : 1,
                      cursor: (!formData.title || !formData.subtitle) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {editingActivity ? '💾 Modifier' : '✨ Créer l\'activité'}
                  </button>
                </div>
                {(!formData.title || !formData.subtitle) && (
                  <div style={{ 
                    marginTop: '1rem', 
                    padding: '0.75rem', 
                    background: '#fff3cd', 
                    border: '1px solid #ffc107', 
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: '#856404'
                  }}>
                    ⚠️ Veuillez remplir au moins le titre et la description pour continuer
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de prévisualisation */}
      <AnimatePresence>
        {showPreview && previewActivity && (
          <div className="modal-overlay" onClick={() => setShowPreview(false)}>
            <motion.div
              className="modal-content modal-preview"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="preview-header">
                <h3>Aperçu : {previewActivity.title}</h3>
                <button className="btn-close" onClick={() => setShowPreview(false)}>×</button>
              </div>
              <div className="preview-content">
                <div className="preview-eyebrow">{previewActivity.eyebrow}</div>
                <h2>{previewActivity.title}</h2>
                <p className="preview-subtitle">{previewActivity.subtitle}</p>
                {previewActivity.meta && (
                  <div className="preview-meta">
                    <p><strong>Âge:</strong> {previewActivity.meta.age}</p>
                    <p><strong>Équipement:</strong> {previewActivity.meta.equipment}</p>
                  </div>
                )}
                {previewActivity.sections?.map((section, idx) => (
                  <div key={idx} className="preview-section">
                    <h4>{section.title}</h4>
                    {section.paragraphs?.map((p, pIdx) => (
                      <p key={pIdx}>{p}</p>
                    ))}
                    {section.bullets && section.bullets.length > 0 && (
                      <ul>
                        {section.bullets.map((bullet, bIdx) => (
                          <li key={bIdx}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Supprimer l'activité"
        message="Êtes-vous sûr de vouloir supprimer cette activité ? Cette action est irréversible."
        type="danger"
        confirmText="Supprimer"
        danger={true}
      />
    </div>
  );
};

export default ManageActivities;

