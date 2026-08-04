-- DEV UNIQUEMENT — ne jamais exécuter sur la base de production.
-- Mot de passe : admin123 (à changer immédiatement même en local).
--
-- Usage local :
--   mysql -u root -p afboxing < backend/database/seed_dev_admin.sql

INSERT INTO users (username, password, role)
VALUES (
  'admin',
  '$2y$10$uZCnqO0jzZMfjNV8iPBUFeIhTQe4F7DYxJt3Ghqy5uD4rwZ0w.z6',
  'admin'
)
ON DUPLICATE KEY UPDATE username = username;
