-- Schéma complet de la base de données AF Boxing Club 86

CREATE DATABASE IF NOT EXISTS afboxing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE afboxing;

-- Utilisateurs (admin)
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Actualités
-- Structure alignée avec le front React (title, date, summary, description, image)
CREATE TABLE IF NOT EXISTS news (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  image VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB;

-- Galerie
CREATE TABLE IF NOT EXISTS gallery (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  image VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB;

-- Planning
-- On stocke directement le créneau sous forme de texte (ex: "18h00-19h00")
CREATE TABLE IF NOT EXISTS schedule (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  day VARCHAR(20) NOT NULL,
  time_range VARCHAR(50) NOT NULL,
  activity VARCHAR(100) NOT NULL,
  level VARCHAR(100) DEFAULT NULL,
  activity_id VARCHAR(100) DEFAULT NULL,
  INDEX idx_schedule_activity_id (activity_id)
) ENGINE=InnoDB;

-- Palmarès
-- Structure alignée avec le front React (title, date, location, category, result, boxer, details, image)
CREATE TABLE IF NOT EXISTS palmares (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  location VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  result VARCHAR(100) NOT NULL,
  boxer VARCHAR(255) NOT NULL,
  details TEXT NOT NULL,
  image VARCHAR(255) DEFAULT NULL,
  year INT NOT NULL,
  deleted_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB;

-- Contacts
CREATE TABLE IF NOT EXISTS contacts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  is_replied TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB;

-- Réponses envoyées depuis l'admin aux messages de contact
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
) ENGINE=InnoDB;

-- Activités
CREATE TABLE IF NOT EXISTS activities (
  id VARCHAR(100) PRIMARY KEY,
  kind VARCHAR(50) NOT NULL DEFAULT 'boxing',
  title VARCHAR(255) NOT NULL,
  eyebrow VARCHAR(255) DEFAULT NULL,
  subtitle TEXT NOT NULL,
  schedule_activity_name VARCHAR(100) DEFAULT NULL,
  meta_age VARCHAR(100) DEFAULT NULL,
  meta_equipment TEXT DEFAULT NULL,
  meta_price_key VARCHAR(100) DEFAULT NULL,
  sections JSON DEFAULT NULL,
  icon VARCHAR(50) DEFAULT NULL,
  image VARCHAR(255) DEFAULT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB;

-- Paramètres du site
CREATE TABLE IF NOT EXISTS settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT DEFAULT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Historique des actions admin
CREATE TABLE IF NOT EXISTS activity_log (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  description TEXT DEFAULT NULL,
  user VARCHAR(100) NOT NULL,
  metadata JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entity (entity),
  INDEX idx_action (action),
  INDEX idx_user (user),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- Membres de l'équipe (page publique /equipe)
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
) ENGINE=InnoDB;

-- Saisons sportives (tarifs)
CREATE TABLE IF NOT EXISTS seasons (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  is_current TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_seasons_current (is_current)
) ENGINE=InnoDB;

INSERT INTO seasons (label, starts_on, ends_on, is_current)
VALUES ('2025-2026', '2025-09-01', '2026-08-31', 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);

-- Tarifs
CREATE TABLE IF NOT EXISTS pricing (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  season_id INT UNSIGNED NOT NULL,
  price_key VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  period VARCHAR(20) NOT NULL DEFAULT 'an',
  note TEXT DEFAULT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'boxing',
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  activity_id VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_category (category),
  INDEX idx_enabled (enabled),
  INDEX idx_pricing_activity_id (activity_id),
  INDEX idx_pricing_season (season_id),
  UNIQUE KEY uq_pricing_season_key (season_id, price_key),
  UNIQUE KEY uq_pricing_season_activity (season_id, activity_id),
  CONSTRAINT fk_pricing_season FOREIGN KEY (season_id) REFERENCES seasons(id)
) ENGINE=InnoDB;

-- Données par défaut pour les tarifs (saison courante id=1 après seed)
INSERT INTO pricing (season_id, price_key, label, amount, period, note, category) VALUES
(1, 'boxing.educative', 'Boxe Éducative', 80.00, 'an', 'Licence comprise – Certificat médical obligatoire', 'boxing'),
(1, 'boxing.loisir', 'Boxe Loisir', 120.00, 'an', 'Licence comprise – Certificat médical obligatoire', 'boxing'),
(1, 'boxing.amateur', 'Boxe Amateur', 120.00, 'an', 'Licence comprise – Certificat médical obligatoire', 'boxing'),
(1, 'boxing.handiboxe', 'Handiboxe', 120.00, 'an', 'Licence comprise – Certificat médical obligatoire', 'boxing'),
(1, 'boxing.aeroboxe', 'Aeroboxe', 120.00, 'an', 'Licence comprise – Certificat médical obligatoire', 'boxing'),
(1, 'boxing.therapie', 'Boxe Thérapie', 120.00, 'an', 'Licence comprise – Certificat médical obligatoire', 'boxing'),
(1, 'social.periscolaire', 'Programme Social-Éducatif', 30.00, 'an', 'Tarif dégressif selon quotient familial (CAF)', 'social')
ON DUPLICATE KEY UPDATE label = VALUES(label);

-- ⚠️ SÉCURITÉ : Ne pas utiliser ce mot de passe en production !
-- Utilisateur admin par défaut (UNIQUEMENT pour développement)
-- En production, créez un utilisateur avec un mot de passe fort via :
-- INSERT INTO users (username, password, role) VALUES ('admin', '$2y$10$...', 'admin');
-- où le hash est généré avec: password_hash('votre_mot_de_passe_fort', PASSWORD_BCRYPT)
-- 
-- Pour générer un hash de mot de passe en PHP :
-- php -r "echo password_hash('votre_mot_de_passe', PASSWORD_BCRYPT);"
--
-- Mot de passe par défaut (DEV UNIQUEMENT) : admin123
-- Hash correspondant (à NE JAMAIS utiliser en production) :
INSERT INTO users (username, password, role)
VALUES (
  'admin',
  '$2y$10$uZCnqO0jzZMfjNV8iPBUFeIhTQe4F7DYxJt3Ghqy5uD4rwZ0w.z6', -- ⚠️ DEV ONLY - À CHANGER EN PROD
  'admin'
)
ON DUPLICATE KEY UPDATE username = username;


