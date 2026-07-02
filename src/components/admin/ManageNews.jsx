import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faCalendarAlt, faImage, faNewspaper } from '@fortawesome/free-solid-svg-icons';
import { newsApi, uploadApi } from '../../services/apiService';
import { useAdminNotify } from '../../hooks/useAdminNotify';
import { todayISO } from '../../utils/adminAutoFill';
import ConfirmDialog from './ConfirmDialog';
import { LoadingState, ErrorState } from '../PageStates';
import PageHeader from '../ui/PageHeader';
import { TextInput, TextArea } from '../ui/FormField';
import { WizardModal, ImageUploadField, EmptyStateGuided, HighlightableCard } from './guided';
import HelpTip from './guided/HelpTip';
import { adminBreadcrumbs } from '../../utils/adminBreadcrumbs';
import { NAV_ITEMS } from '../../constants/adminCopy';
import './ManageNews.scss';

const ManageNews = () => {
  const { notifySuccess, notifyError } = useAdminNotify('news');
  const [searchParams, setSearchParams] = useSearchParams();
  const [news, setNews] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    date: todayISO(),
    summary: '',
    description: '',
    image: '',
  });

  useEffect(() => {
    loadNews();
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      handleAddNew();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

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
    let filtered = [...news].sort(
      (a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at)
    );
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.summary?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [news, search]);

  const resetForm = () => ({
    title: '',
    date: todayISO(),
    summary: '',
    description: '',
    image: '',
  });

  const handleSubmit = async () => {
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
        notifySuccess(`Actualité « ${payload.title} » enregistrée.`);
      } else {
        await newsApi.create(payload);
        notifySuccess(`Actualité « ${payload.title} » publiée.`);
      }
      await loadNews();
      handleCloseModal();
    } catch (err) {
      notifyError(err, 'Impossible d\'enregistrer l\'actualité. Vérifiez les champs et réessayez.');
    } finally {
      setUploading(false);
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
      notifySuccess('Actualité supprimée.');
      await loadNews();
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
  };

  const handleAddNew = () => {
    setEditingNews(null);
    setFormData(resetForm());
    setFile(null);
    setShowModal(true);
  };

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

      <div className="news-list">
        {loading && <LoadingState label="Chargement des actualités…" />}
        {error && !loading && (
          <ErrorState title="Actualités indisponibles" message={error} onRetry={loadNews} />
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
                {new Date(item.date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
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
      </div>

      <WizardModal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingNews ? 'Modifier l\'actualité' : 'Publier une actualité'}
        steps={wizardSteps}
        onComplete={handleSubmit}
        isEdit={!!editingNews}
        canProceed={canProceed}
        completing={uploading}
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
          'Cette action ne peut pas être annulée.',
        ]}
        type="danger"
        confirmText="Supprimer"
        danger
      />
    </div>
  );
};

export default ManageNews;
