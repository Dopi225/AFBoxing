-- Idempotence et statut d'envoi des réponses contact
-- Exécuter une fois sur la base existante.

ALTER TABLE contact_replies
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'sent' AFTER sent_by_name,
  ADD COLUMN idempotency_key VARCHAR(64) NULL DEFAULT NULL AFTER status;

CREATE UNIQUE INDEX uq_contact_replies_idempotency
  ON contact_replies (idempotency_key);
