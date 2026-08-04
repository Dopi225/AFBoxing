import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faCalendarAlt, faImage, faNewspaper } from '@fortawesome/free-solid-svg-icons';
import { newsApi, uploadApi } from '../../services/apiService';
import { useAdminNotify } from '../../hooks/useAdminNotify';
import { useFormDraft } from '../../hooks/useFormDraft';
import { useEntityTrash } from '../../hooks/useEntityTrash';
import { todayISO } from '../../utils/adminAutoFill';
import { validateRequired } from '../../utils/formValidation';
import { toPersistableMediaUrl, isEphemeralMediaUrl } from '../../utils/mediaUrl';
import ConfirmDialog from './ConfirmDialog';
import TrashPanel, { TrashTabs } from './TrashPanel';
import { LoadingState, ErrorState } from '../PageStates';
import PageHeader from '../ui/PageHeader';
import { TextInput, TextArea } from '../ui/FormField';
import { WizardModal, ImageUploadField, EmptyStateGuided, HighlightableCard } from './guided';
import HelpTip from './guided/HelpTip';
import LoadMoreButton from '../ui/LoadMoreButton';
import { formatDateFR, parseLocalDate } from '../../utils/dateFormat';
import { textIncludes } from '../../utils/textSearch';
import { toUserMessage } from '../../utils/userFacingError';
import { adminBreadcrumbs } from '../../utils/adminBreadcrumbs';
import { NAV_ITEMS } from '../../constants/adminCopy';
import './ManageNews.scss';

const DRAFT_KEY = 'afboxing_draft_news';

const ManageNews = () => {
  const { notifySuccess, notifyError } = useAdminNotify('news');
  const [searchParams, setSearchParams] = useSearchParams();
  const [news, setNews] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    date: todayISO(),
    summary: '',
    description: '',
    image: '',
  });

  const restoreDraft = useCallback((data) => {
    setFormData((prev) => ({ ...prev, ...data, image: isEphemeralMediaUrl(data.image) ? '' : (data.image || '') }));
  }, []);

  const { clearDraft } = useFormDraft(DRAFT_KEY, formData, {
    enabled: showModal && !editingNews,
    onRestore: restoreDraft,
  });

  const loadNews = useCallback(async (opts = {}) => {
    const nextPage = opts.page ?? 1;
    const append = Boolean(opts.append);
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError('');
    try {
      const raw = await newsApi.list({ page: nextPage, per_page: 50, withMeta: true });
      const items = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : []);
      const meta = raw?.meta || {};
      setNews((prev) => (append ? [...prev, ...items] : items));
      setPage(meta.page || nextPage);
      setTotalPages(meta.total_pages || 1);
      setTotalItems(meta.total ?? items.length);
    } catch (err) {
      setError(toUserMessage(err, 'Impossible de charger les actualités.'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
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
  } = useEntityTrash(newsApi, {
    onReload: () => loadNews({ page: 1 }),
    notifySuccess,
    notifyError,
    entityLabel: 'Actualité',
  });

  useEffect(() => {
    loadNews({ page: 1 });
    loadTrash();
  }, [loadNews, loadTrash]);

  const filteredNews = useMemo(() => {
    let filtered = [...news].sort(
      (a, b) =>
        (parseLocalDate(b.date || b.created_at)?.getTime() || 0) -
        (parseLocalDate(a.date || a.created_at)?.getTime() || 0)
    );
    if (search.trim()) {
      filtered = filtered.filter(
        (item) => textIncludes(item.title, search) || textIncludes(item.summary, search)
      );
    }
    return filtered;
  }, [news, search]);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      handleAddNew();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const blurField = (field, label) => (e) => {
    setFieldErrors((prev) => ({ ...prev, [field]: validateRequired(e.target.value, label) }));
  };

  const resetForm = () => ({
    title: '',
    date: todayISO(),
    summary: '',
    description: '',
    image: '',
  });

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
        const result = await uploadApi.uploadImage('news', file);
        payload.image = result.url;
        setUploading(false);
      }
      if (editingNews) {
        await newsApi.update(editingNews.id, payload);
        notifySuccess(`Actualité « ${payload.title} » enregistrée.`);
      } else {
        await newsApi.create(payload);
        notifySuccess(`Actualité « ${payload.title} » publiée.`);
      }
      await loadNews({ page: 1 });
      clearDraft();
      handleCloseModal();
    } catch (err) {
      notifyError(err, 'Impossible d\'enregistrer l\'actualité. Vérifiez les champs et réessayez.');
    } finally {
      setUploading(false);
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingNews(item);
    setFormData({
      title: item.title,
      date: item.date,
      summary: item.summary,
      description: item.description,
      image: item.image || '',
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
      await newsApi.remove(deleteTarget.id);
      notifySuccess('Actualité déplacée en corbeille (conservation 30 jours).');
      await loadNews({ page: 1 });
      loadTrash();
    } catch (err) {
      notifyError(err, 'Impossible de supprimer cette actualité.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingNews(null);
    setFormData(resetForm());
    setFile(null);
    setFieldErrors({});
  };

  const handleAddNew = () => {
    setEditingNews(null);
    setFormData(resetForm());
    setFile(null);
    setFieldErrors({});
    setShowModal(true);
  };

  const getBlockedMessage = (step) => {
    if (step === 1) {
      if (!formData.title.trim()) return 'Indiquez le titre pour continuer.';
      if (!formData.date) return 'Indiquez la date pour continuer.';
    }
    if (step === 2) {
      if (!formData.summary.trim()) return 'Indiquez le résumé pour continuer.';
      if (!formData.description.trim()) return 'Indiquez le texte complet pour continuer.';
    }
    return '';
  };

  const isFormDirty = Boolean(
    formData.title.trim() ||
    formData.summary.trim() ||
    formData.description.trim() ||
    formData.image ||
    file
  );

  const canProceed = (step) => {
    if (step === 1) return formData.title.trim() && formData.date;
    if (step === 2) return formData.summary.trim() && formData.description.trim();
    return true;
  };

  const wizardSteps = [
    {
      title: 'Titre et date',
      description: 'Donnez un titre clair à votre actualité et indiquez quand elle a lieu.',
      content: (
        <>
          <TextInput
            label="Titre de l'actualité"
            name="news-title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            onBlur={blurField('title', 'Le titre')}
            error={fieldErrors.title}
            required
            help="Ce titre apparaîtra en grand sur le site."
            example="Tournoi interclubs du 15 mars"
          />
          <TextInput
            label="Date"
            name="news-date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            onBlur={blurField('date', 'La date')}
            error={fieldErrors.date}
            required
            help="La date de l'événement ou de la publication."
          />
        </>
      ),
    },
    {
      title: 'Texte',
      description: 'Rédigez un court résumé puis le texte complet.',
      content: (
        <>
          <TextArea
            label="Résumé court"
            name="news-summary"
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            onBlur={blurField('summary', 'Le résumé')}
            error={fieldErrors.summary}
            rows={2}
            required
            help="Une ou deux phrases visibles dans la liste des actualités."
            example="Le club organise son tournoi annuel. Inscriptions ouvertes."
          />
          <TextArea
            label="Texte complet"
            name="news-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            onBlur={blurField('description', 'Le texte complet')}
            error={fieldErrors.description}
            rows={5}
            required
            help="Le détail de l'actualité, visible quand on clique dessus."
          />
        </>
      ),
    },
    {
      title: 'Photo',
      description: 'Ajoutez une photo pour rendre l\'actualité plus attractive (facultatif).',
      content: (
        <ImageUploadField
          label="Photo de l'actualité"
          name="news-image"
          value={formData.image}
          folder="news"
          required={false}
          onFileSelect={setFile}
          onChange={({ preview }) => setFormData((prev) => ({ ...prev, image: preview || prev.image }))}
          example="Photo de l'événement ou de l'équipe"
        />
      ),
    },
  ];

  return (
    <div className="manage-news">
      <PageHeader
        title="Actualités"
        subtitle="Publiez les nouvelles du club sur le site."
        breadcrumbs={adminBreadcrumbs(NAV_ITEMS.news)}
        actions={
          <button type="button" className="btn btn-primary" onClick={handleAddNew}>
            <FontAwesomeIcon icon={faPlus} />
            Publier une actualité
          </button>
        }
      />

      <TrashTabs
        view={view}
        onViewChange={setView}
        activeCount={news.length}
        trashCount={trashItems.length}
      />

      {view === 'active' ? (
      <div className="simple-filters">
        <label htmlFor="news-search" className="visually-hidden">Rechercher</label>
        <input
          id="news-search"
          type="search"
          className="form-input"
          placeholder="Rechercher une actualité…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <HelpTip text="Les actualités les plus récentes s'affichent en premier." />
      </div>
      ) : null}

      {view === 'trash' ? (
        <TrashPanel
          items={trashItems}
          loading={trashLoading}
          emptyMessage="Aucune actualité en corbeille."
          getItemLabel={(item) => item.title}
          getItemMeta={(item) =>
            item.date
              ? formatDateFR(item.date, { style: 'long' })
              : null
          }
          onRestore={restoreItem}
          restoringId={restoringId}
        />
      ) : (
      <div className="news-list">
        {loading && <LoadingState label="Chargement des actualités…" />}
        {error && !loading && (
          <ErrorState title="Actualités indisponibles" message={error} onRetry={() => loadNews({ page: 1 })} />
        )}
        {!loading && !error && filteredNews.length === 0 ? (
          <EmptyStateGuided
            icon={faNewspaper}
            title="Aucune actualité"
            message={news.length === 0
              ? 'Commencez par publier la première nouvelle du club.'
              : 'Aucun résultat pour cette recherche.'}
            actionLabel={news.length === 0 ? 'Publier une actualité' : undefined}
            onAction={news.length === 0 ? handleAddNew : undefined}
          />
        ) : null}
        {!loading && !error && filteredNews.map((item) => (
          <HighlightableCard key={item.id} id={item.id} className="news-card">
            <div className="news-image">
              {item.image ? (
                <img src={item.image} alt="" loading="lazy" />
              ) : (
                <div className="no-image">
                  <FontAwesomeIcon icon={faImage} aria-hidden />
                </div>
              )}
            </div>
            <div className="news-content">
              <h3>{item.title}</h3>
              <div className="news-meta">
                <FontAwesomeIcon icon={faCalendarAlt} aria-hidden />
                {formatDateFR(item.date, { style: 'long' })}
              </div>
              <p className="summary">{item.summary}</p>
              <div className="news-actions">
                <button type="button" className="btn-edit" onClick={() => handleEdit(item)}>
                  <FontAwesomeIcon icon={faEdit} aria-hidden />
                  Modifier
                </button>
                <button type="button" className="btn-delete" onClick={() => handleDelete(item)}>
                  <FontAwesomeIcon icon={faTrash} aria-hidden />
                  Supprimer
                </button>
              </div>
            </div>
          </HighlightableCard>
        ))}
        {!loading && !error && view !== 'trash' ? (
          <LoadMoreButton
            hasMore={page < totalPages}
            loading={loadingMore}
            loadedCount={news.length}
            total={totalItems}
            onClick={() => loadNews({ page: page + 1, append: true })}
          />
        ) : null}
      </div>
      )}

      <WizardModal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingNews ? 'Modifier l\'actualité' : 'Publier une actualité'}
        steps={wizardSteps}
        onComplete={handleSubmit}
        isEdit={!!editingNews}
        canProceed={canProceed}
        getBlockedMessage={getBlockedMessage}
        isDirty={isFormDirty}
        completing={saving || uploading}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Supprimer cette actualité ?"
        itemLabel={deleteTarget?.title}
        consequences={[
          'L\'actualité disparaîtra du site public.',
          'Elle restera en corbeille 30 jours et pourra être restaurée.',
        ]}
        type="danger"
        confirmText="Supprimer"
        danger
      />
    </div>
  );
};

export default ManageNews;
