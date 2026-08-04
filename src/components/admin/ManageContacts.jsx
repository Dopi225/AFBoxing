import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRequireAdmin } from '../../hooks/useRequireAdmin';
import { useEntityTrash } from '../../hooks/useEntityTrash';
import { useFormDraft } from '../../hooks/useFormDraft';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faTrash,
  faCheck,
  faUser,
  faPhone,
  faCalendarAlt,
  faReply,
  faPaperPlane,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { contactsApi } from '../../services/apiService';
import { useAdminNotify } from '../../hooks/useAdminNotify';
import { formatRelativeDate, CONTACT_REPLY_TEMPLATES, NAV_ITEMS } from '../../constants/adminCopy';
import { logActivity } from '../../utils/activityLogger';
import ConfirmDialog from './ConfirmDialog';
import TrashPanel, { TrashTabs } from './TrashPanel';
import PageHeader from '../ui/PageHeader';
import { TextArea } from '../ui/FormField';
import { EmptyStateGuided, HighlightableCard } from './guided';
import { adminBreadcrumbs } from '../../utils/adminBreadcrumbs';
import './ManageContacts.scss';

const mapContact = (c) => ({
  ...c,
  username: c.name,
  date: c.created_at,
  read: c.is_read === 1 || c.is_read === true,
  replied: c.is_replied === 1 || c.is_replied === true,
  replies: Array.isArray(c.replies) ? c.replies : [],
});

const ManageContacts = () => {
  const adminOk = useRequireAdmin();
  const [searchParams] = useSearchParams();
  const { notifySuccess, notifyError } = useAdminNotify('contacts');
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const initialFilter =
    searchParams.get('filter') === 'unread'
      ? 'unread'
      : searchParams.get('filter') === 'replied'
        ? 'replied'
        : searchParams.get('filter') === 'read'
          ? 'read'
          : 'all';
  const [filter, setFilter] = useState(initialFilter);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [replyError, setReplyError] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const draftKey = selectedContact
    ? `afboxing_draft_contact_reply_${selectedContact.id}`
    : 'afboxing_draft_contact_reply_none';

  const { clearDraft } = useFormDraft(
    draftKey,
    { body: replyBody },
    {
      enabled: showReplyForm && !!selectedContact,
      onRestore: (data) => {
        if (data?.body) setReplyBody(data.body);
      },
    }
  );

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await contactsApi.list();
      const mapped = (Array.isArray(data) ? data : [])
        .map(mapContact)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      setContacts(mapped);
      setSelectedContact((prev) => {
        if (!prev) return prev;
        const refreshed = mapped.find((c) => c.id === prev.id);
        return refreshed || prev;
      });
    } catch (err) {
      setError(err.message || 'Impossible de charger les messages.');
    } finally {
      setLoading(false);
    }
  }, []);

  const trash = useEntityTrash(contactsApi, {
    onReload: loadContacts,
    notifySuccess,
    notifyError,
    entityLabel: 'Message',
  });

  useEffect(() => {
    if (!adminOk) return;
    loadContacts();
  }, [adminOk, loadContacts]);

  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (!highlightId || !contacts.length) return;
    const found = contacts.find((c) => String(c.id) === String(highlightId));
    if (found) setSelectedContact(found);
  }, [contacts, searchParams]);

  useEffect(() => {
    setShowReplyForm(false);
    setReplyBody('');
    setReplyError('');
  }, [selectedContact?.id]);

  const getContactLabel = (contact) => {
    if (!contact) return undefined;
    const name = contact.name || contact.username;
    if (name && contact.email) return `${name} — ${contact.email}`;
    return contact.message?.substring(0, 80);
  };

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    if (!contact.read) {
      contactsApi.markAsRead(contact.id).then(() => loadContacts()).catch(() => {});
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await contactsApi.markAsRead(id);
      notifySuccess('Message marqué comme lu.');
      loadContacts();
    } catch (err) {
      notifyError(err, 'Impossible de marquer le message comme lu.');
    }
  };

  const handleDelete = (contact) => {
    setDeleteTarget(contact);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await contactsApi.remove(deleteTarget.id);
      notifySuccess('Message déplacé en corbeille.');
      loadContacts();
      if (selectedContact?.id === deleteTarget.id) {
        setSelectedContact(null);
      }
    } catch (err) {
      notifyError(err, 'Impossible de supprimer ce message.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const applyTemplate = (template) => {
    setReplyBody(template.body);
    setReplyError('');
    setShowReplyForm(true);
  };

  const handleSendReply = async () => {
    if (!selectedContact) return;
    const trimmed = replyBody.trim();
    if (trimmed.length < 10) {
      setReplyError('Écrivez au moins quelques mots avant d\'envoyer (10 caractères minimum).');
      return;
    }
    setReplyError('');
    setSendingReply(true);
    try {
      const result = await contactsApi.reply(selectedContact.id, { body: trimmed });
      const updated = result?.contact ? mapContact(result.contact) : null;
      logActivity(
        'create',
        'contact',
        `Réponse envoyée à ${selectedContact.name || selectedContact.username || 'un contact'}`
      );
      notifySuccess(
        `Réponse envoyée à ${selectedContact.name || selectedContact.email}.`
      );
      clearDraft();
      setReplyBody('');
      setShowReplyForm(false);
      await loadContacts();
      if (updated) setSelectedContact(updated);
    } catch (err) {
      notifyError(
        err,
        'L\'email n\'a pas pu être envoyé. Vérifiez l\'adresse du contact ou réessayez plus tard.'
      );
    } finally {
      setSendingReply(false);
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    if (filter === 'unread') return !contact.read;
    if (filter === 'read') return contact.read && !contact.replied;
    if (filter === 'replied') return contact.replied;
    return true;
  });

  const unreadCount = contacts.filter((c) => !c.read).length;
  const readOnlyCount = contacts.filter((c) => c.read && !c.replied).length;
  const repliedCount = contacts.filter((c) => c.replied).length;

  const statusBadge = (contact) => {
    if (contact.replied) return { className: 'status-badge replied', label: 'Répondu' };
    if (!contact.read) return { className: 'status-badge unread-badge', label: 'Non lu' };
    return { className: 'status-badge read-badge', label: 'Lu' };
  };

  const threadReplies = useMemo(
    () => selectedContact?.replies || [],
    [selectedContact]
  );

  if (!adminOk) {
    return (
      <div className="manage-contacts">
        <div className="admin-state--loading" role="status" aria-live="polite">
          <span className="admin-state__spinner" aria-hidden />
          <p>Vérification des droits…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-contacts">
      <PageHeader
        title="Messages reçus"
        subtitle="Messages envoyés via le formulaire de contact. Vous pouvez y répondre directement depuis cette page."
        breadcrumbs={adminBreadcrumbs(NAV_ITEMS.contacts)}
        actions={
          trash.view === 'active' ? (
            <div className="filter-buttons">
              <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
                Tous ({contacts.length})
              </button>
              <button type="button" className={filter === 'unread' ? 'active' : ''} onClick={() => setFilter('unread')}>
                Non lus ({unreadCount})
              </button>
              <button type="button" className={filter === 'read' ? 'active' : ''} onClick={() => setFilter('read')}>
                Lus ({readOnlyCount})
              </button>
              <button type="button" className={filter === 'replied' ? 'active' : ''} onClick={() => setFilter('replied')}>
                Répondu ({repliedCount})
              </button>
            </div>
          ) : null
        }
      />

      <TrashTabs
        view={trash.view}
        onViewChange={trash.setView}
        activeCount={contacts.length}
        trashCount={trash.trashItems.length}
      />

      {trash.view === 'trash' ? (
        <TrashPanel
          items={trash.trashItems}
          loading={trash.trashLoading}
          emptyMessage="Aucun message en corbeille."
          getItemLabel={getContactLabel}
          getItemMeta={(item) => formatRelativeDate(item.created_at || item.date)}
          onRestore={trash.restoreItem}
          restoringId={trash.restoringId}
        />
      ) : (
        <div className="contacts-layout">
          <div className="contacts-list">
            {loading && (
              <div className="admin-state--loading" role="status" aria-live="polite">
                <span className="admin-state__spinner" aria-hidden />
                <p>Chargement des messages…</p>
              </div>
            )}
            {error && !loading && (
              <div className="admin-state--error" role="alert">
                {error}
              </div>
            )}
            {!loading && !error && (
              <>
                {filteredContacts.length === 0 ? (
                  contacts.length === 0 ? (
                    <EmptyStateGuided
                      icon={faEnvelope}
                      title="Aucun message"
                      message="Les visiteurs du site peuvent vous écrire via le formulaire de contact. Les messages apparaîtront ici."
                    />
                  ) : (
                    <div className="admin-state--empty">
                      <p>Aucun message dans cette catégorie.</p>
                    </div>
                  )
                ) : (
                  filteredContacts.map((contact) => {
                    const badge = statusBadge(contact);
                    return (
                      <HighlightableCard
                        key={contact.id}
                        id={contact.id}
                        as="button"
                        type="button"
                        className={`contact-item ${!contact.read ? 'unread' : ''} ${selectedContact?.id === contact.id ? 'selected' : ''}`}
                        onClick={() => handleSelectContact(contact)}
                      >
                        <div className="contact-header">
                          <div className="contact-info">
                            <h4>{contact.username || 'Sans nom'}</h4>
                            <span className={badge.className}>{badge.label}</span>
                          </div>
                          <span className="contact-date">{formatRelativeDate(contact.date)}</span>
                        </div>
                        <p className="contact-email">{contact.email}</p>
                        <p className="contact-preview">{contact.message?.substring(0, 80)}…</p>
                      </HighlightableCard>
                    );
                  })
                )}
              </>
            )}
          </div>

          {selectedContact ? (
            <div className="contact-detail">
              <div className="detail-header">
                <h3>Message de {selectedContact.username || 'visiteur'}</h3>
                <div className="detail-actions">
                  {!selectedContact.read && (
                    <button
                      type="button"
                      className="btn-mark-read"
                      onClick={() => handleMarkAsRead(selectedContact.id)}
                    >
                      <FontAwesomeIcon icon={faCheck} />
                      Marquer comme lu
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => handleDelete(selectedContact)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    Supprimer
                  </button>
                </div>
              </div>

              <div className="detail-content">
                <div className="detail-item">
                  <FontAwesomeIcon icon={faUser} />
                  <div>
                    <label>Nom</label>
                    <p>{selectedContact.username || 'Non renseigné'}</p>
                  </div>
                </div>

                <div className="detail-item">
                  <FontAwesomeIcon icon={faEnvelope} />
                  <div>
                    <label>Email</label>
                    <p>
                      <a href={`mailto:${selectedContact.email}`}>{selectedContact.email}</a>
                    </p>
                  </div>
                </div>

                {selectedContact.phone ? (
                  <div className="detail-item">
                    <FontAwesomeIcon icon={faPhone} />
                    <div>
                      <label>Téléphone</label>
                      <p>
                        <a href={`tel:${selectedContact.phone}`}>{selectedContact.phone}</a>
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="detail-item">
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  <div>
                    <label>Date</label>
                    <p>{new Date(selectedContact.date).toLocaleString('fr-FR')}</p>
                  </div>
                </div>

                <div className="contact-thread" aria-label="Fil de discussion">
                  <article className="thread-bubble thread-bubble--incoming">
                    <header>
                      <strong>Message reçu</strong>
                      <time dateTime={selectedContact.date}>
                        {new Date(selectedContact.date).toLocaleString('fr-FR')}
                      </time>
                    </header>
                    <p>{selectedContact.message}</p>
                  </article>

                  {threadReplies.map((reply) => (
                    <article key={reply.id} className="thread-bubble thread-bubble--outgoing">
                      <header>
                        <strong>Réponse envoyée</strong>
                        <time dateTime={reply.createdAt}>
                          {reply.createdAt
                            ? new Date(reply.createdAt).toLocaleString('fr-FR')
                            : ''}
                        </time>
                      </header>
                      <p className="thread-meta">
                        Envoyé par {reply.sentByName || 'Admin'}
                      </p>
                      <p>{reply.body}</p>
                    </article>
                  ))}
                </div>

                <div className="contact-reply-panel">
                  {!showReplyForm ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-reply"
                      onClick={() => setShowReplyForm(true)}
                    >
                      <FontAwesomeIcon icon={faReply} />
                      Répondre
                    </button>
                  ) : (
                    <>
                      <p className="reply-templates-label">Modèles de réponse (un clic pour préremplir) :</p>
                      <div className="reply-templates">
                        {CONTACT_REPLY_TEMPLATES.map((tpl) => (
                          <button
                            key={tpl.id}
                            type="button"
                            className="reply-template-btn"
                            onClick={() => applyTemplate(tpl)}
                            disabled={sendingReply}
                          >
                            {tpl.label}
                          </button>
                        ))}
                      </div>
                      <TextArea
                        label="Votre réponse"
                        name="contact-reply-body"
                        value={replyBody}
                        onChange={(e) => {
                          setReplyBody(e.target.value);
                          if (replyError) setReplyError('');
                        }}
                        rows={8}
                        required
                        error={replyError}
                        help={`Sera envoyée à ${selectedContact.email}. Vous pouvez modifier le texte avant d'envoyer.`}
                      />
                      <div className="reply-actions">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleSendReply}
                          disabled={sendingReply || replyBody.trim().length < 10}
                        >
                          {sendingReply ? (
                            <>
                              <FontAwesomeIcon icon={faSpinner} spin />
                              Envoi en cours…
                            </>
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faPaperPlane} />
                              Envoyer la réponse
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setShowReplyForm(false);
                            setReplyError('');
                          }}
                          disabled={sendingReply}
                        >
                          Annuler
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="contact-detail-placeholder">
              Sélectionnez un message dans la liste pour le lire et y répondre.
            </p>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Supprimer ce message ?"
        itemLabel={getContactLabel(deleteTarget)}
        consequences={[
          'Le message et les réponses associées seront déplacés en corbeille pendant 30 jours.',
          'Vous pourrez le restaurer depuis la corbeille pendant ce délai.',
        ]}
        type="danger"
        confirmText="Supprimer"
        danger={true}
      />
    </div>
  );
};

export default ManageContacts;
