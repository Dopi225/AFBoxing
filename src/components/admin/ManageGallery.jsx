import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faImage, faImages } from '@fortawesome/free-solid-svg-icons';
import { galleryApi, uploadApi } from '../../services/apiService';
import { useAdminNotify } from '../../hooks/useAdminNotify';
import { useFormDraft } from '../../hooks/useFormDraft';
import { useEntityTrash } from '../../hooks/useEntityTrash';
import { GALLERY_CATEGORIES } from '../../constants/adminCopy';
import { validateRequired } from '../../utils/formValidation';
import ConfirmDialog from './ConfirmDialog';
import TrashPanel, { TrashTabs } from './TrashPanel';
import PageHeader from '../ui/PageHeader';
import { TextInput, TextArea, SelectField } from '../ui/FormField';
import { LoadingState, ErrorState } from '../PageStates';
import { WizardModal, ImageUploadField, EmptyStateGuided, HighlightableCard } from './guided';
import HelpTip from './guided/HelpTip';
import { adminBreadcrumbs } from '../../utils/adminBreadcrumbs';
import { NAV_ITEMS } from '../../constants/adminCopy';
import './ManageGallery.scss';

const DRAFT_KEY = 'afboxing_draft_gallery';

const CATEGORIES = [
  ...GALLERY_CATEGORIES,
  { value: 'Jeunesse', label: 'Jeunesse', help: 'Activités jeunes' },
  { value: 'Loisir', label: 'Loisir', help: 'Boxe loisir' },
  { value: 'Inclusion', label: 'Inclusion', help: 'Handiboxe et inclusion' },
  { value: 'Fitness', label: 'Fitness', help: 'Préparation physique' },
  { value: 'Bien-être', label: 'Bien-être', help: 'Séances bien-être' },
  { value: 'Social', label: 'Social', help: 'Actions socio-éducatives' },
];

const ManageGallery = () => {
  const { notifySuccess, notifyError } = useAdminNotify('gallery');
  const [searchParams, setSearchParams] = useSearchParams();
  const [gallery, setGallery] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Infrastructure',
    description: '',
    src: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const restoreDraft = useCallback((data) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  const { clearDraft } = useFormDraft(DRAFT_KEY, formData, {
    enabled: showModal && !editingItem,
    onRestore: restoreDraft,
  });

  const loadGallery = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await galleryApi.list();
      setGallery(data.map((item) => ({ ...item, src: item.image })));
    } catch (err) {
      setError(err.message || 'Impossible de charger la galerie.');
    } finally {
      setLoading(false);
    }
  }, []);

  const {
    view,
    setView,
    trashItems,
    trashLoading,
    restoringId,
    restoreItem,
    loadTrash,
  } = useEntityTrash(galleryApi, {
    onReload: loadGallery,
    notifySuccess,
    notifyError,
    entityLabel: 'Photo',
  });

  useEffect(() => {
    loadGallery();
    loadTrash();
  }, [loadGallery, loadTrash]);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setShowModal(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const blurField = (field, label) => (e) => {
    setFieldErrors((prev) => ({ ...prev, [field]: validateRequired(e.target.value, label) }));
  };

  const handleSubmit = async () => {
    if (!file && !formData.src && !editingItem) {
      notifyError('Veuillez choisir une photo avant d\'enregistrer.');
      return;
    }
    const payload = {
      title: formData.title.trim(),
      category: formData.category,
      description: formData.description?.trim() || null,
      image: formData.src || null,
    };
    try {
      if (file) {
        setUploading(true);
        const result = await uploadApi.uploadImage('gallery', file);
        payload.image = result.url;
      }
      if (editingItem) {
        await galleryApi.update(editingItem.id, payload);
        notifySuccess(`Photo « ${payload.title} » enregistrée.`);
      } else {
        await galleryApi.create(payload);
        notifySuccess(`Photo « ${payload.title} » ajoutée à la galerie.`);
      }
      await loadGallery();
      clearDraft();
      handleCloseModal();
    } catch (err) {
      notifyError(err, 'Impossible d\'enregistrer la photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      description: item.description || '',
      src: item.image || item.src || '',
    });
    setFile(null);
    setShowModal(true);
  };

  const handleDelete = (item) => {
    setDeleteTarget(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await galleryApi.remove(deleteTarget.id);
      notifySuccess('Photo déplacée en corbeille (conservation 30 jours).');
      await loadGallery();
      loadTrash();
    } catch (err) {
      notifyError(err, 'Impossible de supprimer cette photo.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({ title: '', category: 'Infrastructure', description: '', src: '' });
    setFile(null);
    setFieldErrors({});
  };

  const selectedCategoryHelp = CATEGORIES.find((c) => c.value === formData.category)?.help;

  const getBlockedMessage = (step) => {
    if (step === 1 && !file && !formData.src && !editingItem) {
      return 'Choisissez une photo pour continuer.';
    }
    if (step === 2) {
      if (!formData.title.trim()) return 'Indiquez le titre pour continuer.';
      if (!formData.category) return 'Choisissez une rubrique pour continuer.';
    }
    return '';
  };

  const isFormDirty = Boolean(
    formData.title.trim() ||
    formData.description.trim() ||
    formData.src ||
    file
  );

  const canProceed = (step) => {
    if (step === 1) return (file || formData.src) || editingItem;
    if (step === 2) return formData.title.trim() && formData.category;
    return true;
  };

  const wizardSteps = [
    {
      title: 'Choisir une photo',
      description: editingItem
        ? 'Vous pouvez remplacer la photo ou conserver l\'actuelle.'
        : 'Sélectionnez la photo à afficher dans la galerie du site.',
      content: (
        <ImageUploadField
          label="Photo"
          name="gallery-file"
          value={formData.src}
          folder="gallery"
          required={!editingItem}
          onFileSelect={setFile}
          onChange={({ preview }) => setFormData((p) => ({ ...p, src: preview || p.src }))}
        />
      ),
    },
    {
      title: 'Décrire la photo',
      description: 'Donnez un titre et choisissez dans quelle rubrique classer la photo.',
      content: (
        <>
          <TextInput
            label="Titre de la photo"
            name="gallery-title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            onBlur={blurField('title', 'Le titre')}
            error={fieldErrors.title}
            required
            example="Salle d'entraînement rénovée"
          />
          <SelectField
            label="Rubrique"
            name="gallery-category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            onBlur={blurField('category', 'La rubrique')}
            error={fieldErrors.category}
            required
            options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
          />
          {selectedCategoryHelp ? <HelpTip text={selectedCategoryHelp} /> : null}
          <TextArea
            label="Description"
            name="gallery-desc"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            optionalLabel="(facultatif)"
          />
        </>
      ),
    },
  ];

  return (
    <div className="manage-gallery">
      <PageHeader
        title="Galerie photos"
        subtitle="Les photos apparaissent sur la page Galerie du site."
        breadcrumbs={adminBreadcrumbs(NAV_ITEMS.gallery)}
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FontAwesomeIcon icon={faPlus} />
            Ajouter une photo
          </button>
        }
      />

      <TrashTabs
        view={view}
        onViewChange={setView}
        activeCount={gallery.length}
        trashCount={trashItems.length}
      />

      {view === 'trash' ? (
        <TrashPanel
          items={trashItems}
          loading={trashLoading}
          emptyMessage="Aucune photo en corbeille."
          getItemLabel={(item) => item.title}
          getItemMeta={(item) => item.category}
          onRestore={restoreItem}
          restoringId={restoringId}
        />
      ) : (
      <div className="gallery-grid">
        {loading && <LoadingState label="Chargement de la galerie…" />}
        {error && !loading && (
          <ErrorState title="Galerie indisponible" message={error} onRetry={loadGallery} />
        )}
        {!loading && !error && gallery.length === 0 ? (
          <EmptyStateGuided
            icon={faImages}
            title="Aucune photo"
            message="Ajoutez votre première photo pour illustrer le club sur le site."
            actionLabel="Ajouter une photo"
            onAction={() => setShowModal(true)}
          />
        ) : null}
        {!loading && !error && gallery.map((item) => (
          <HighlightableCard key={item.id} id={item.id} className="gallery-item">
            <div className="gallery-image">
              {item.src ? (
                <img src={item.src} alt={item.title} loading="lazy" />
              ) : (
                <div className="no-image"><FontAwesomeIcon icon={faImage} aria-hidden /></div>
              )}
            </div>
            <div className="gallery-info">
              <h4>{item.title}</h4>
              <span className="category">{item.category}</span>
            </div>
            <div className="gallery-item-actions">
              <button type="button" className="btn-edit" onClick={() => handleEdit(item)}>Modifier</button>
              <button type="button" className="btn-delete" onClick={() => handleDelete(item)}>Supprimer</button>
            </div>
          </HighlightableCard>
        ))}
      </div>
      )}

      <WizardModal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingItem ? 'Modifier la photo' : 'Ajouter une photo'}
        steps={wizardSteps}
        onComplete={handleSubmit}
        isEdit={!!editingItem}
        canProceed={canProceed}
        getBlockedMessage={getBlockedMessage}
        isDirty={isFormDirty}
        completing={uploading}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
        onConfirm={confirmDelete}
        title="Supprimer cette photo ?"
        itemLabel={deleteTarget?.title}
        consequences={[
          'La photo disparaîtra de la galerie du site.',
          'Elle restera en corbeille 30 jours et pourra être restaurée.',
        ]}
        type="danger"
        confirmText="Supprimer"
        danger
      />
    </div>
  );
};

export default ManageGallery;
