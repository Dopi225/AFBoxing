import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faEye,
  faFistRaised,
  faGraduationCap,
} from '@fortawesome/free-solid-svg-icons';
import { useAdminNotify } from '../../hooks/useAdminNotify';
import { useFormDraft } from '../../hooks/useFormDraft';
import { useEntityTrash } from '../../hooks/useEntityTrash';
import { validateRequired } from '../../utils/formValidation';
import { prepareActivityPayload } from '../../utils/adminAutoFill';
import { ACTIVITY_KIND_LABELS, NAV_ITEMS } from '../../constants/adminCopy';
import { adminBreadcrumbs } from '../../utils/adminBreadcrumbs';
import { activitiesApi, pricingApi } from '../../services/apiService';
import { logActivity } from '../../utils/activityLogger';
import ConfirmDialog from './ConfirmDialog';
import TrashPanel, { TrashTabs } from './TrashPanel';
import Modal from '../ui/Modal';
import PageHeader from '../ui/PageHeader';
import { TextInput, TextArea, SelectField } from '../ui/FormField';
import { LoadingState } from '../PageStates';
import {
  WizardModal,
  ContentBlockEditor,
  normalizeSectionsForApi,
  EmptyStateGuided,
  HighlightableCard,
} from './guided';
import HelpTip from './guided/HelpTip';
import './ManageActivities.scss';

const DRAFT_KEY = 'afboxing_draft_activities';

const CATEGORIES = {
  boxing: { label: ACTIVITY_KIND_LABELS.boxing, icon: faFistRaised },
  social: { label: ACTIVITY_KIND_LABELS.social, icon: faGraduationCap },
};

const emptyForm = () => ({
  id: '',
  kind: 'boxing',
  title: '',
  eyebrow: '',
  subtitle: '',
  scheduleActivityName: '',
  meta: { age: '', equipment: '', priceKey: '' },
  sections: [],
  icon: 'faFistRaised',
  image: '',
  enabled: true,
});

function normalizeSectionsForEditor(sections) {
  return (sections || []).map((s) => ({
    title: s.title || '',
    type: s.bullets?.length ? 'bullets' : 'paragraphs',
    paragraphs: s.paragraphs?.length ? s.paragraphs : [''],
    bullets: s.bullets?.length ? s.bullets : [''],
  }));
}

const ManageActivities = () => {
  const { notifySuccess, notifyError } = useAdminNotify('activities');
  const [activities, setActivities] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [previewActivity, setPreviewActivity] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const formBaselineRef = useRef(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pricingCatalog, setPricingCatalog] = useState([]);
  const [filterKind, setFilterKind] = useState('all');
  const [formData, setFormData] = useState(emptyForm());

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      setActivities(await activitiesApi.list());
    } catch (err) {
      notifyError(err, 'Impossible de charger les activités.');
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  const trash = useEntityTrash(activitiesApi, {
    onReload: loadActivities,
    notifySuccess,
    notifyError,
    entityLabel: 'Activité',
  });

  useEffect(() => {
    loadActivities();
    pricingApi.catalog().then((rows) => setPricingCatalog(Array.isArray(rows) ? rows : [])).catch(() => {});
  }, [loadActivities]);

  const isDirty = showModal && JSON.stringify(formData) !== JSON.stringify(formBaselineRef.current);

  const { clearDraft } = useFormDraft(DRAFT_KEY, formData, {
    enabled: showModal && !editingActivity && isDirty,
    onRestore: (data) => {
      setFormData({ ...emptyForm(), ...data, meta: { ...emptyForm().meta, ...(data.meta || {}) } });
    },
  });

  const validateField = (name, value, label) => {
    const err = validateRequired(value, label);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
    return err;
  };

  const getBlockedMessage = (step) => {
    if (step === 1 && !formData.title?.trim()) return 'Remplissez le nom de l\'activité pour continuer.';
    if (step === 2 && !formData.subtitle?.trim()) return 'Remplissez la description courte pour continuer.';
    return '';
  };

  const pricingOptions = useMemo(
    () => [
      { value: '', label: '— Aucun tarif affiché —' },
      ...pricingCatalog
        .filter((p) => p.enabled !== false)
        .map((p) => ({
          value: p.priceKey,
          label: `${p.label} — ${p.amount} € / ${p.period === 'an' ? 'an' : p.period}`,
        })),
    ],
    [pricingCatalog]
  );

  const filtered = filterKind === 'all' ? activities : activities.filter((a) => a.kind === filterKind);

  const handleAddNew = () => {
    setEditingActivity(null);
    const empty = emptyForm();
    setFormData(empty);
    formBaselineRef.current = empty;
    setFieldErrors({});
    setShowModal(true);
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    const normalized = {
      ...emptyForm(),
      ...activity,
      meta: { ...emptyForm().meta, ...activity.meta },
      sections: normalizeSectionsForEditor(activity.sections),
    };
    setFormData(normalized);
    formBaselineRef.current = normalized;
    setFieldErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingActivity(null);
    setFieldErrors({});
  };

  const handleSubmit = async () => {
    if (!formData.title?.trim() || !formData.subtitle?.trim()) {
      notifyError('Le nom et la description courte sont obligatoires.');
      return;
    }
    const existingIds = activities.map((a) => a.id);
    const payload = prepareActivityPayload(
      {
        ...formData,
        scheduleActivityName: formData.scheduleActivityName?.trim() || formData.title.trim(),
        sections: normalizeSectionsForApi(formData.sections),
        meta: {
          ...formData.meta,
          priceKey: formData.meta?.priceKey?.trim() || null,
        },
      },
      existingIds
    );
    setSaving(true);
    try {
      if (editingActivity) {
        await activitiesApi.update(editingActivity.id, payload);
        logActivity('update', 'activity', `Activité « ${payload.title} » modifiée`);
        notifySuccess(`Activité « ${payload.title} » enregistrée.`);
      } else {
        await activitiesApi.create(payload);
        logActivity('create', 'activity', `Activité « ${payload.title} » créée`);
        notifySuccess(`Activité « ${payload.title} » créée.`);
      }
      await loadActivities();
      clearDraft();
      handleCloseModal();
      setFormData(emptyForm());
    } catch (err) {
      notifyError(err, 'Impossible d\'enregistrer cette activité.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleClick = (activity) => {
    setToggleTarget(activity);
    setShowToggleConfirm(true);
  };

  const confirmToggle = async () => {
    if (!toggleTarget) return;
    try {
      const updated = { ...toggleTarget, enabled: !toggleTarget.enabled };
      await activitiesApi.update(toggleTarget.id, updated);
      notifySuccess(updated.enabled ? 'Activité visible sur le site.' : 'Activité masquée du site.');
      await loadActivities();
    } catch (err) {
      notifyError(err, 'Impossible de modifier la visibilité.');
    } finally {
      setToggleTarget(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await activitiesApi.remove(deleteTarget.id);
      logActivity('delete', 'activity', `Activité déplacée en corbeille : ${deleteTarget.title}`);
      notifySuccess('Activité déplacée en corbeille.');
      await loadActivities();
    } catch (err) {
      notifyError(err, 'Impossible de supprimer cette activité.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const canProceed = (step) => {
    if (step === 1) return formData.title?.trim();
    if (step === 2) return formData.subtitle?.trim();
    return true;
  };

  const wizardSteps = [
    {
      title: 'Type et nom',
      description: 'Choisissez le type d\'activité et donnez-lui un nom clair.',
      content: (
        <>
          <SelectField
            label="Type d'activité"
            name="act-kind"
            value={formData.kind}
            onChange={(e) => setFormData({ ...formData, kind: e.target.value })}
            options={Object.entries(CATEGORIES).map(([k, c]) => ({ value: k, label: c.label }))}
            help="Boxe : activités sportives. Socio-éducatif : actions éducatives et sociales."
          />
          <TextInput
            label="Nom de l'activité"
            name="act-title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            onBlur={() => validateField('title', formData.title, 'Le nom de l\'activité')}
            error={fieldErrors.title}
            required
            example="Boxe éducative"
          />
        </>
      ),
    },
    {
      title: 'Présentation',
      description: 'Ces textes apparaissent sur la fiche activité du site.',
      content: (
        <>
          <TextInput
            label="Phrase sous le titre (facultatif)"
            name="act-eyebrow"
            value={formData.eyebrow}
            onChange={(e) => setFormData({ ...formData, eyebrow: e.target.value })}
            help="Courte phrase sous le titre."
            example="8–17 ans • Technique • Valeurs"
          />
          <TextArea
            label="Description courte"
            name="act-subtitle"
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            onBlur={() => validateField('subtitle', formData.subtitle, 'La description courte')}
            error={fieldErrors.subtitle}
            rows={3}
            required
            help="Résumé visible sur la liste des activités."
          />
        </>
      ),
    },
    {
      title: 'Informations pratiques',
      description: 'Âge, matériel, tarif et nom affiché dans le planning.',
      content: (
        <>
          <TextInput
            label="Tranche d'âge"
            name="act-age"
            value={formData.meta.age}
            onChange={(e) => setFormData({ ...formData, meta: { ...formData.meta, age: e.target.value } })}
            optionalLabel="(facultatif)"
            example="8–17 ans"
          />
          <TextInput
            label="Équipement nécessaire"
            name="act-equipment"
            value={formData.meta.equipment}
            onChange={(e) => setFormData({ ...formData, meta: { ...formData.meta, equipment: e.target.value } })}
            optionalLabel="(facultatif)"
            example="Tenue de sport, chaussures propres"
          />
          <SelectField
            label="Tarif affiché sur la fiche"
            name="act-price"
            value={formData.meta.priceKey || ''}
            onChange={(e) => setFormData({ ...formData, meta: { ...formData.meta, priceKey: e.target.value } })}
            options={pricingOptions}
            help="Les montants se gèrent dans la section Tarifs."
          />
          <TextInput
            label="Nom dans le planning"
            name="act-schedule-name"
            value={formData.scheduleActivityName}
            onChange={(e) => setFormData({ ...formData, scheduleActivityName: e.target.value })}
            help="Laissez vide pour utiliser le nom de l'activité."
            placeholder={formData.title || 'Boxe éducative'}
          />
        </>
      ),
    },
    {
      title: 'Contenu détaillé',
      description: 'Ajoutez des blocs pour détailler l\'activité (facultatif).',
      content: (
        <ContentBlockEditor
          sections={formData.sections}
          onChange={(sections) => setFormData({ ...formData, sections })}
        />
      ),
    },
  ];

  if (loading) {
    return (
      <div className="manage-activities">
        <LoadingState label="Chargement des activités…" />
      </div>
    );
  }

  return (
    <div className="manage-activities">
      <PageHeader
        title="Activités"
        subtitle="Définissez les activités proposées par le club. Elles alimentent le planning et les fiches du site."
        breadcrumbs={adminBreadcrumbs(NAV_ITEMS.activities)}
        actions={
          <button type="button" className="btn btn-primary" onClick={handleAddNew}>
            <FontAwesomeIcon icon={faPlus} />
            Ajouter une activité
          </button>
        }
      />

      <HelpTip text="Avant de remplir le planning, créez d'abord vos activités ici." />

      <TrashTabs
        view={trash.view}
        onViewChange={trash.setView}
        activeCount={activities.length}
        trashCount={trash.trashItems.length}
      />

      {trash.view === 'active' ? (
        <>
      <div className="category-filters">
        <button type="button" className={`category-filter ${filterKind === 'all' ? 'active' : ''}`} onClick={() => setFilterKind('all')}>
          Toutes ({activities.length})
        </button>
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <button
            key={key}
            type="button"
            className={`category-filter ${filterKind === key ? 'active' : ''}`}
            onClick={() => setFilterKind(key)}
          >
            <FontAwesomeIcon icon={cat.icon} aria-hidden /> {cat.label}
          </button>
        ))}
      </div>

      <div className="activities-list">
        {filtered.length === 0 ? (
          <EmptyStateGuided
            icon={faFistRaised}
            title="Aucune activité"
            message="Créez votre première activité avant de remplir le planning."
            actionLabel="Ajouter une activité"
            onAction={handleAddNew}
          />
        ) : (
          filtered.map((activity) => {
            const cat = CATEGORIES[activity.kind] || CATEGORIES.boxing;
            return (
              <HighlightableCard key={activity.id} id={activity.id} className={`activity-card ${!activity.enabled ? 'disabled' : ''}`}>
                <div className="activity-header">
                  <div className="activity-info">
                    <span className="activity-category-badge">
                      <FontAwesomeIcon icon={cat.icon} aria-hidden /> {cat.label}
                    </span>
                    <h3>{activity.title}</h3>
                    {activity.eyebrow ? <p className="activity-eyebrow">{activity.eyebrow}</p> : null}
                    <p className="activity-subtitle">{activity.subtitle}</p>
                    <p className="activity-visibility">
                      {activity.enabled !== false ? 'Visible sur le site' : 'Masquée du site'}
                    </p>
                  </div>
                  <div className="activity-actions">
                    <button type="button" className="btn-edit" onClick={() => { setPreviewActivity(activity); setShowPreview(true); }}>
                      <FontAwesomeIcon icon={faEye} aria-hidden /> Aperçu
                    </button>
                    <button type="button" className="btn-edit" onClick={() => handleEdit(activity)}>
                      <FontAwesomeIcon icon={faEdit} aria-hidden /> Modifier
                    </button>
                    <button type="button" className="btn-edit" onClick={() => handleToggleClick(activity)}>
                      {activity.enabled !== false ? 'Masquer' : 'Afficher'}
                    </button>
                    <button type="button" className="btn-delete" onClick={() => { setDeleteTarget(activity); setShowDeleteConfirm(true); }}>
                      <FontAwesomeIcon icon={faTrash} aria-hidden /> Supprimer
                    </button>
                  </div>
                </div>
              </HighlightableCard>
            );
          })
        )}
      </div>
        </>
      ) : (
        <TrashPanel
          items={trash.trashItems}
          loading={trash.trashLoading}
          emptyMessage="Aucune activité en corbeille."
          getItemLabel={(item) => item.title || `#${item.id}`}
          onRestore={trash.restoreItem}
          restoringId={trash.restoringId}
        />
      )}

      <WizardModal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingActivity ? 'Modifier l\'activité' : 'Ajouter une activité'}
        steps={wizardSteps}
        onComplete={handleSubmit}
        isEdit={!!editingActivity}
        canProceed={canProceed}
        getBlockedMessage={getBlockedMessage}
        isDirty={isDirty}
        completing={saving}
        size="xl"
      />

      <Modal
        isOpen={showPreview && !!previewActivity}
        onClose={() => setShowPreview(false)}
        size="lg"
        title={previewActivity ? `Aperçu : ${previewActivity.title}` : 'Aperçu'}
      >
        {previewActivity ? (
          <div className="preview-content">
            {previewActivity.eyebrow ? <div className="preview-eyebrow">{previewActivity.eyebrow}</div> : null}
            <p className="preview-subtitle">{previewActivity.subtitle}</p>
            {previewActivity.sections?.map((section, idx) => (
              <div key={idx} className="preview-section">
                <h4>{section.title}</h4>
                {section.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
                {section.bullets?.length ? (
                  <ul>{section.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={showToggleConfirm}
        onClose={() => { setShowToggleConfirm(false); setToggleTarget(null); }}
        onConfirm={confirmToggle}
        title={toggleTarget?.enabled !== false ? 'Masquer cette activité ?' : 'Afficher cette activité ?'}
        itemLabel={toggleTarget?.title}
        consequences={
          toggleTarget?.enabled !== false
            ? [
                'L\'activité ne sera plus visible sur le site public.',
                'Elle reste modifiable et pourra être réaffichée.',
              ]
            : ['L\'activité sera de nouveau visible sur le site public.']
        }
        confirmText={toggleTarget?.enabled !== false ? 'Masquer' : 'Afficher'}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
        onConfirm={confirmDelete}
        title="Supprimer cette activité ?"
        itemLabel={deleteTarget?.title}
        consequences={[
          'L\'activité sera déplacée en corbeille pendant 30 jours.',
          'Elle disparaîtra du site et du planning pendant ce délai.',
          'Vous pourrez la restaurer depuis la corbeille.',
        ]}
        type="danger"
        confirmText="Supprimer"
        danger
      />
    </div>
  );
};

export default ManageActivities;
