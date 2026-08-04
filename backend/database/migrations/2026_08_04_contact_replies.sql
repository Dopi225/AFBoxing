-- Réponses aux messages de contact + statut « Répondu »
-- Exécuter une fois sur la base existante.

ALTER TABLE contacts
  ADD COLUMN is_replied TINYINT(1) NOT NULL DEFAULT 0 AFTER is_read;

CREATE TABLE IF NOT EXISTS contact_replies (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  contact_id INT UNSIGNED NOT NULL,
  body TEXT NOT NULL,
  sent_by_user_id INT UNSIGNED NULL,
  sent_by_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contact_replies_contact (contact_id, created_at),
  CONSTRAINT fk_contact_replies_contact
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
