import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRequireAdmin } from '../../hooks/useRequireAdmin';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faTrash, faCheck, faUser, faPhone, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { contactsApi } from '../../services/apiService';
import { useAdminNotify } from '../../hooks/useAdminNotify';
import { formatRelativeDate } from '../../constants/adminCopy';
import ConfirmDialog from './ConfirmDialog';
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

  useEffect(() => {
    if (!adminOk) return;
    loadContacts();
  }, [adminOk]);

  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (!highlightId || !contacts.length) return;
    const found = contacts.find((c) => String(c.id) === String(highlightId));
    if (found) setSelectedContact(found);
  }, [contacts, searchParams]);

  const loadContacts = async () => {
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

  const handleDelete = (id) => {
    setDeleteTarget(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await contactsApi.remove(deleteTarget);
      notifySuccess('Message supprimé.');
      loadContacts();
      if (selectedContact?.id === deleteTarget) {
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
        }
      />

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
                  onClick={() => handleDelete(selectedContact.id)}
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

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Supprimer ce message ?"
        consequences={[
          'Le message sera définitivement effacé.',
          'Vous ne pourrez plus le consulter.',
        ]}
        type="danger"
        confirmText="Supprimer"
        danger={true}
      />
    </div>
  );
};

export default ManageContacts;

