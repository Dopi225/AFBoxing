-- Corbeille 30 jours : colonne deleted_at sur les entités métier
-- Les suppressions deviennent des soft-delete ; purge manuelle ou cron après 30 j.

ALTER TABLE news ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE gallery ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE palmares ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE activities ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE pricing ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

CREATE INDEX idx_news_deleted_at ON news (deleted_at);
CREATE INDEX IF NOT EXISTS idx_gallery_deleted_at ON gallery (deleted_at);
CREATE INDEX IF NOT EXISTS idx_palmares_deleted_at ON palmares (deleted_at);
CREATE INDEX IF NOT EXISTS idx_contacts_deleted_at ON contacts (deleted_at);
CREATE INDEX IF NOT EXISTS idx_activities_deleted_at ON activities (deleted_at);
CREATE INDEX IF NOT EXISTS idx_pricing_deleted_at ON pricing (deleted_at);
