-- Gestion d'équipe : fiches membres visibles sur /equipe
-- Soft-delete (corbeille 30 jours) via deleted_at

CREATE TABLE IF NOT EXISTS team_members (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name       VARCHAR(255) NOT NULL,
  role_label      VARCHAR(255) NOT NULL,
  category        VARCHAR(100) NOT NULL,
  bio             TEXT NULL,
  photo           VARCHAR(500) NULL,
  certifications  TEXT NULL,
  display_order   INT NOT NULL DEFAULT 0,
  enabled         TINYINT(1) NOT NULL DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_team_category_order (category, display_order),
  INDEX idx_team_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
