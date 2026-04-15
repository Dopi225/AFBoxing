-- Planning : lien optionnel vers une activité (table activities)
-- Exécuter sur une base existante après sauvegarde.

ALTER TABLE schedule
  ADD COLUMN activity_id VARCHAR(100) NULL DEFAULT NULL AFTER level,
  ADD INDEX idx_schedule_activity_id (activity_id);

-- MySQL 8+ / InnoDB : contrainte de clé étrangère (ignorer si erreur sur ancien moteur)
-- ALTER TABLE schedule
--   ADD CONSTRAINT fk_schedule_activity
--   FOREIGN KEY (activity_id) REFERENCES activities(id)
--   ON DELETE SET NULL ON UPDATE CASCADE;

-- Renseigner activity_id quand le libellé planning = nom planning de l’activité
UPDATE schedule s
INNER JOIN activities a
  ON a.schedule_activity_name IS NOT NULL
  AND TRIM(a.schedule_activity_name) = TRIM(s.activity)
SET s.activity_id = a.id
WHERE s.activity_id IS NULL;
