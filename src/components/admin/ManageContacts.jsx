import React, { useState, useEffect } from 'react';
import { useRequireAdmin } from '../../hooks/useRequireAdmin';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faTrash, faCheck, faUser, faPhone, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { motion as Motion } from 'framer-motion';
import { contactsApi } from '../../services/apiService';
import { useNotifications } from './NotificationSystem';
import ConfirmDialog from './ConfirmDialog';
import './ManageContacts.scss';

const ManageContacts = () => {
  const adminOk = useRequireAdmin();
  const { success, error: notifyError } = useNotifications();
  const [contacts, setContacts] = useState([]); 
  const [selectedContact, setSelectedContact] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!adminOk) return;
    loadContacts();
  }, [adminOk]);

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
      success('✅ Message marqué comme lu');
      loadContacts();
    } catch {
      notifyError('❌ Erreur lors du marquage du message');
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
      success('🗑️ Contact supprimé avec succès');
      loadContacts();
      if (selectedContact?.id === deleteTarget) {
        setSelectedContact(null);
      }
    } catch {
      notifyError('Erreur lors de la suppression du contact.');
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
      <div className="page-header">
        <h2>Gestion des Contacts</h2>
        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            Tous ({contacts.length})
          </button>
          <button
            className={filter === 'unread' ? 'active' : ''}
            onClick={() => setFilter('unread')}
          >
            Non lus ({unreadCount})
          </button>
          <button
            className={filter === 'read' ? 'active' : ''}
            onClick={() => setFilter('read')}
          >
            Lus ({contacts.length - unreadCount})
          </button>
        </div>
      </div>

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
                <div className="admin-state--empty">
                  <p>
                    {contacts.length === 0
                      ? 'Aucun message pour le moment. Les envois du formulaire contact apparaîtront ici.'
                      : 'Aucun message dans cette catégorie.'}
                  </p>
                </div>
              ) : (
                filteredContacts.map((contact, index) => (
                  <Motion.div
                    key={contact.id}
                    className={`contact-item ${!contact.read ? 'unread' : ''} ${selectedContact?.id === contact.id ? 'selected' : ''}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedContact(contact)}
                  >
                    <div className="contact-header">
                      <div className="contact-info">
                        <h4>{contact.username || 'Sans nom'}</h4>
                        {!contact.read && <span className="unread-badge">Nouveau</span>}
                      </div>
                      <span className="contact-date">
                        {new Date(contact.date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <p className="contact-email">{contact.email}</p>
                    <p className="contact-preview">{contact.message?.substring(0, 60)}...</p>
                  </Motion.div>
                ))
              )}
            </>
          )}
        </div>

        {selectedContact && (
          <Motion.div
            className="contact-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="detail-header">
              <h3>Détails du contact</h3>
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
          </Motion.div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Supprimer le contact"
        message="Êtes-vous sûr de vouloir supprimer ce contact ? Cette action est irréversible."
        type="danger"
        confirmText="Supprimer"
        danger={true}
      />
    </div>
  );
};

export default ManageContacts;

