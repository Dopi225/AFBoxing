import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRequireAdmin } from '../../hooks/useRequireAdmin';
import { useEntityTrash } from '../../hooks/useEntityTrash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faTrash, faCheck, faUser, faPhone, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { contactsApi } from '../../services/apiService';
import { useAdminNotify } from '../../hooks/useAdminNotify';
import { formatRelativeDate } from '../../constants/adminCopy';
import ConfirmDialog from './ConfirmDialog';
import TrashPanel, { TrashTabs } from './TrashPanel';
import PageHeader from '../ui/PageHeader';
import { EmptyStateGuided, HighlightableCard } from './guided';
import { adminBreadcrumbs } from '../../utils/adminBreadcrumbs';
import { NAV_ITEMS } from '../../constants/adminCopy';
import './ManageContacts.scss';

const ManageContacts = () => {
  const adminOk = useRequireAdmin();
  const [searchParams] = useSearchParams();
  const { notifySuccess, notifyError } = useAdminNotify('contacts');
  const [contacts, setContacts] = useState([]); 
  const [selectedContact, setSelectedContact] = useState(null);
  const [filter, setFilter] = useState(searchParams.get('filter') === 'unread' ? 'unread' : 'all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await contactsApi.list();
      setContacts(
        data
          .map(c => ({
            ...c,
            username: c.name,
            date: c.created_at,
            read: c.is_read === 1 || c.is_read === true
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date))
      );
    } catch (err) {
      setError(err.message || 'Impossible de charger les contacts.');
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

  const getContactLabel = (contact) => {
    if (!contact) return undefined;
    const name = contact.name || contact.username;
    if (name && contact.email) return `${name} — ${contact.email}`;
    return contact.message?.substring(0, 80);
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

  const filteredContacts = contacts.filter(contact => {
    if (filter === 'unread') return !contact.read;
    if (filter === 'read') return contact.read;
    return true;
  });

  const unreadCount = contacts.filter(c => !c.read).length;

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
        subtitle="Messages envoyés via le formulaire de contact du site."
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
              Déjà lus ({contacts.length - unreadCount})
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
                filteredContacts.map((contact) => (
                  <HighlightableCard
                    key={contact.id}
                    id={contact.id}
                    as="button"
                    type="button"
                    className={`contact-item ${!contact.read ? 'unread' : ''} ${selectedContact?.id === contact.id ? 'selected' : ''}`}
                    onClick={() => setSelectedContact(contact)}
                  >
                    <div className="contact-header">
                      <div className="contact-info">
                        <h4>{contact.username || 'Sans nom'}</h4>
                        {!contact.read ? <span className="unread-badge">Non lu</span> : null}
                      </div>
                      <span className="contact-date">{formatRelativeDate(contact.date)}</span>
                    </div>
                    <p className="contact-email">{contact.email}</p>
                    <p className="contact-preview">{contact.message?.substring(0, 80)}…</p>
                  </HighlightableCard>
                ))
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
                    className="btn-mark-read"
                    onClick={() => handleMarkAsRead(selectedContact.id)}
                  >
                    <FontAwesomeIcon icon={faCheck} />
                    Marquer comme lu
                  </button>
                )}
                <button
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
                  <p><a href={`mailto:${selectedContact.email}`}>{selectedContact.email}</a></p>
                </div>
              </div>

              {selectedContact.phone && (
                <div className="detail-item">
                  <FontAwesomeIcon icon={faPhone} />
                  <div>
                    <label>Téléphone</label>
                    <p><a href={`tel:${selectedContact.phone}`}>{selectedContact.phone}</a></p>
                  </div>
                </div>
              )}

              <div className="detail-item">
                <FontAwesomeIcon icon={faCalendarAlt} />
                <div>
                  <label>Date</label>
                  <p>{new Date(selectedContact.date).toLocaleString('fr-FR')}</p>
                </div>
              </div>

              <div className="detail-message">
                <label>Message</label>
                <p>{selectedContact.message}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="contact-detail-placeholder">Sélectionnez un message dans la liste pour le lire.</p>
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
          'Le message sera déplacé en corbeille pendant 30 jours.',
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

