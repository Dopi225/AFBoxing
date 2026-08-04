import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faCalendarAlt, faMapMarkerAlt, faUser, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { palmaresApi, uploadApi } from '../../services/apiService';
import { useAdminNotify } from '../../hooks/useAdminNotify';
import { useFormDraft } from '../../hooks/useFormDraft';
import { useEntityTrash } from '../../hooks/useEntityTrash';
import { todayISO } from '../../utils/adminAutoFill';
import { formatDateFR, parseLocalDate } from '../../utils/dateFormat';
import { validateRequired } from '../../utils/formValidation';
import { toPersistableMediaUrl, isEphemeralMediaUrl } from '../../utils/mediaUrl';
import { PALMARES_CATEGORIES, PALMARES_RESULTS } from '../../constants/adminCopy';
import ConfirmDialog from './ConfirmDialog';
import TrashPanel, { TrashTabs } from './TrashPanel';
import PageHeader from '../ui/PageHeader';
import { TextInput, TextArea, SelectField } from '../ui/FormField';
import { LoadingState, ErrorState } from '../PageStates';
import { WizardModal, ImageUploadField, EmptyStateGuided, HighlightableCard } from './guided';
import { adminBreadcrumbs } from '../../utils/adminBreadcrumbs';
import { NAV_ITEMS } from '../../constants/adminCopy';
import './ManagePalmares.scss';

const DRAFT_KEY = 'afboxing_draft_palmares';

const DEFAULT_FORM = {
  title: '',
  date: todayISO(),
  location: '',
  category: 'Amateur',
  result: 'Champion',
  boxer: '',
  details: '',
  image: '',
};

const ManagePalmares = () => {
  const { notifySuccess, notifyError } = useAdminNotify('palmares');
  const [searchParams, setSearchParams] = useSearchParams();
  const [palmares, setPalmares] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({ ...DEFAULT_FORM });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const restoreDraft = useCallback((data) => {
    setFormData((prev) => ({
      ...prev,
      ...data,
      image: isEphemeralMediaUrl(data.image) ? '' : (data.image || ''),
    }));
  }, []);

  const { clearDraft } = useFormDraft(DRAFT_KEY, formData, {
    enabled: showModal && !editingItem,
    onRestore: restoreDraft,
  });

  const loadPalmares = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await palmaresApi.list();
      setPalmares(data.sort((a, b) => (parseLocalDate(b.date)?.getTime() || 0) - (parseLocalDate(a.date)?.getTime() || 0)));
    } catch (err) {
      setError(err.message || 'Impossible de charger les palmarès.');
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
  } = useEntityTrash(palmaresApi, {
    onReload: loadPalmares,
    notifySuccess,
    notifyError,
    entityLabel: 'Palmarès',
  });

  useEffect(() => {
    loadPalmares();
    loadTrash();
  }, [loadPalmares, loadTrash]);

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
    if (saving || uploading) return;
    try {
      setSaving(true);
      const payload = {
        ...formData,
        image: toPersistableMediaUrl(formData.image) || null,
      };
      if (file) {
        setUploading(true);
        const result = await uploadApi.uploadImage('palmares', file);
        payload.image = result.url;
      }
      if (editingItem) {
        await palmaresApi.update(editingItem.id, payload);
        notifySuccess(`Palmarès « ${payload.title} » enregistré.`);
      } else {
        await palmaresApi.create(payload);
        notifySuccess(`Palmarès « ${payload.title} » ajouté.`);
      }
      await loadPalmares();
      clearDraft();
      handleCloseModal();
    } catch (err) {
      notifyError(err, 'Impossible d\'enregistrer ce palmarès.');
    } finally {
      setUploading(false);
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...DEFAULT_FORM, ...item, image: item.image || '' });
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
      await palmaresApi.remove(deleteTarget.id);
      notifySuccess('Palmarès déplacé en corbeille (conservation 30 jours).');
      await loadPalmares();
      loadTrash();
    } catch (err) {
      notifyError(err, 'Impossible de supprimer ce palmarès.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({ ...DEFAULT_FORM, date: todayISO() });
    setFile(null);
    setFieldErrors({});
  };

  const getBlockedMessage = (step) => {
    if (step === 1) {
      if (!formData.title.trim()) return 'Indiquez le titre pour continuer.';
      if (!formData.date) return 'Indiquez la date pour continuer.';
      if (!formData.location.trim()) return 'Indiquez le lieu pour continuer.';
    }
    if (step === 2) {
      if (!formData.boxer.trim()) return 'Indiquez le boxeur ou l\'équipe pour continuer.';
    }
    return '';
  };

  const isFormDirty = Boolean(
    formData.title.trim() ||
    formData.location.trim() ||
    formData.boxer.trim() ||
    formData.details.trim() ||
    formData.image ||
    file
  );

  const canProceed = (step) => {
    if (step === 1) return formData.title.trim() && formData.date && formData.location.trim();
    if (step === 2) return formData.boxer.trim() && formData.result && formData.category;
    return true;
  };

  const wizardSteps = [
    {
      title: 'La compétition',
      description: 'Indiquez de quelle compétition il s\'agit.',
      content: (
        <>
          <TextInput
            label="Nom de la compétition"
            name="palmares-title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            onBlur={blurField('title', 'Le nom de la compétition')}
            error={fieldErrors.title}
            required
            example="Championnat départemental 2025"
          />
          <TextInput
            label="Date"
            name="palmares-date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            onBlur={blurField('date', 'La date')}
            error={fieldErrors.date}
            required
          />
          <TextInput
            label="Lieu"
            name="palmares-location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            onBlur={blurField('location', 'Le lieu')}
            error={fieldErrors.location}
            required
            example="Poitiers"
          />
        </>
      ),
    },
    {
      title: 'Le résultat',
      description: 'Qui a participé et quel a été le résultat ?',
      content: (
        <>
          <SelectField
            label="Catégorie"
            name="palmares-category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
            options={PALMARES_CATEGORIES}
          />
          <SelectField
            label="Résultat obtenu"
            name="palmares-result"
            value={formData.result}
            onChange={(e) => setFormData({ ...formData, result: e.target.value })}
            required
            options={PALMARES_RESULTS}
          />
          <TextInput
            label="Boxeur ou équipe"
            name="palmares-boxer"
            value={formData.boxer}
            onChange={(e) => setFormData({ ...formData, boxer: e.target.value })}
            onBlur={blurField('boxer', 'Le boxeur ou l\'équipe')}
            error={fieldErrors.boxer}
            required
            example="Marie Dupont"
          />
        </>
      ),
    },
    {
      title: 'Détails et photo',
      description: 'Ajoutez des précisions et une photo si vous en avez une.',
      content: (
        <>
          <TextArea
            label="Détails"
            name="palmares-details"
            value={formData.details}
            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            rows={4}
            optionalLabel="(facultatif)"
            help="Informations complémentaires sur la compétition ou le parcours."
          />
          <ImageUploadField
            label="Photo"
            name="palmares-image"
            value={formData.image}
            folder="palmares"
            onFileSelect={setFile}
            onChange={({ preview }) => setFormData((p) => ({ ...p, image: preview || p.image }))}
          />
        </>
      ),
    },
  ];

  return (
    <div className="manage-palmares">
      <PageHeader
        title="Palmarès"
        subtitle="Enregistrez les résultats et victoires du club."
        breadcrumbs={adminBreadcrumbs(NAV_ITEMS.palmares)}
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FontAwesomeIcon icon={faPlus} />
            Ajouter un résultat
          </button>
        }
      />

      <TrashTabs
        view={view}
        onViewChange={setView}
        activeCount={palmares.length}
        trashCount={trashItems.length}
      />

      {view === 'trash' ? (
        <TrashPanel
          items={trashItems}
          loading={trashLoading}
          emptyMessage="Aucun palmarès en corbeille."
          getItemLabel={(item) => item.title}
          getItemMeta={(item) => item.boxer}
          onRestore={restoreItem}
          restoringId={restoringId}
        />
      ) : (
      <div className="palmares-list">
        {loading && <LoadingState label="Chargement des palmarès…" />}
        {error && !loading && (
          <ErrorState title="Palmarès indisponible" message={error} onRetry={loadPalmares} />
        )}
        {!loading && !error && palmares.length === 0 ? (
          <EmptyStateGuided
            icon={faTrophy}
            title="Aucun palmarès"
            message="Ajoutez le premier résultat de compétition pour mettre en valeur les succès du club."
            actionLabel="Ajouter un résultat"
            onAction={() => setShowModal(true)}
          />
        ) : null}
        {!loading && !error && palmares.map((item) => (
          <HighlightableCard key={item.id} id={item.id} className="palmares-card">
            <div className="palmares-content">
              <div className="result-badge">{item.result}</div>
              <h3>{item.title}</h3>
              <div className="palmares-meta">
                <span><FontAwesomeIcon icon={faCalendarAlt} aria-hidden /> {formatDateFR(item.date)}</span>
                <span><FontAwesomeIcon icon={faMapMarkerAlt} aria-hidden /> {item.location}</span>
                <span><FontAwesomeIcon icon={faUser} aria-hidden /> {item.boxer}</span>
              </div>
              <p className="category">{item.category}</p>
              {item.details ? <p className="details">{item.details}</p> : null}
              <div className="palmares-actions">
                <button type="button" className="btn-edit" onClick={() => handleEdit(item)}>
                  <FontAwesomeIcon icon={faEdit} aria-hidden /> Modifier
                </button>
                <button type="button" className="btn-delete" onClick={() => handleDelete(item)}>
                  <FontAwesomeIcon icon={faTrash} aria-hidden /> Supprimer
                </button>
              </div>
            </div>
          </HighlightableCard>
        ))}
      </div>
      )}

      <WizardModal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingItem ? 'Modifier le palmarès' : 'Ajouter un résultat'}
        steps={wizardSteps}
        onComplete={handleSubmit}
        isEdit={!!editingItem}
        canProceed={canProceed}
        getBlockedMessage={getBlockedMessage}
        isDirty={isFormDirty}
        completing={saving || uploading}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
        onConfirm={confirmDelete}
        title="Supprimer ce palmarès ?"
        itemLabel={deleteTarget?.title}
        consequences={[
          'Ce résultat disparaîtra de la page Palmarès du site.',
          'Il restera en corbeille 30 jours et pourra être restauré.',
        ]}
        type="danger"
        confirmText="Supprimer"
        danger
      />
    </div>
  );
};

export default ManagePalmares;
