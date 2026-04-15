-- Tarif optionnellement lié à une activité (une ligne tarif = au plus une activité)
ALTER TABLE pricing
  ADD COLUMN activity_id VARCHAR(100) NULL DEFAULT NULL AFTER enabled,
  ADD INDEX idx_pricing_activity_id (activity_id);

-- Une seule ligne tarif « officielle » par activité (les autres activity_id restent NULL)
CREATE UNIQUE INDEX uq_pricing_activity_id ON pricing (activity_id);
