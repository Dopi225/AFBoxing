-- Tarifs par saison sportive
-- Seed : saison 2025-2026 (sept → août), rattache les tarifs existants

CREATE TABLE IF NOT EXISTS seasons (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  is_current TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_seasons_current (is_current)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO seasons (label, starts_on, ends_on, is_current)
SELECT '2025-2026', '2025-09-01', '2026-08-31', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM seasons LIMIT 1);

-- Colonne saison (nullable le temps du backfill)
ALTER TABLE pricing
  ADD COLUMN season_id INT UNSIGNED NULL AFTER id;

UPDATE pricing
SET season_id = (SELECT id FROM seasons WHERE is_current = 1 ORDER BY id ASC LIMIT 1)
WHERE season_id IS NULL;

ALTER TABLE pricing
  MODIFY season_id INT UNSIGNED NOT NULL;

-- Remplacer les UNIQUE globaux par des UNIQUE par saison
ALTER TABLE pricing
  DROP INDEX price_key;

ALTER TABLE pricing
  DROP INDEX uq_pricing_activity_id;

ALTER TABLE pricing
  ADD UNIQUE KEY uq_pricing_season_key (season_id, price_key),
  ADD UNIQUE KEY uq_pricing_season_activity (season_id, activity_id),
  ADD CONSTRAINT fk_pricing_season FOREIGN KEY (season_id) REFERENCES seasons(id);
