<?php

declare(strict_types=1);

namespace AFBoxing\Models;

use AFBoxing\Core\SoftDelete;
use PDO;

class Pricing
{
    public function __construct(private PDO $pdo)
    {
    }

    public function currentSeasonId(): ?int
    {
        $stmt = $this->pdo->query('SELECT id FROM seasons WHERE is_current = 1 ORDER BY id ASC LIMIT 1');
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? (int)$row['id'] : null;
    }

    public function all(?int $seasonId = null): array
    {
        $seasonId = $seasonId ?? $this->currentSeasonId();
        if ($seasonId === null) {
            return [];
        }
        $nd = SoftDelete::notDeletedClause('p');
        $stmt = $this->pdo->prepare(
            "SELECT p.* FROM pricing p
             WHERE p.season_id = :sid AND p.enabled = 1 AND {$nd}
             ORDER BY p.category, p.price_key"
        );
        $stmt->execute(['sid' => $seasonId]);
        return $stmt->fetchAll();
    }

    /** Liste détaillée admin (jointure activité), filtrée par saison. */
    public function listDetailedForAdmin(?int $seasonId = null): array
    {
        $seasonId = $seasonId ?? $this->currentSeasonId();
        if ($seasonId === null) {
            return [];
        }
        $nd = SoftDelete::notDeletedClause('p');
        $stmt = $this->pdo->prepare(
            "SELECT p.*, a.title AS activity_title
             FROM pricing p
             LEFT JOIN activities a ON a.id = p.activity_id AND a.deleted_at IS NULL
             WHERE p.season_id = :sid AND {$nd}
             ORDER BY p.category, p.price_key"
        );
        $stmt->execute(['sid' => $seasonId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /** Catalogue pour formulaires activités = saison courante uniquement. */
    public function catalogForAdmin(): array
    {
        $seasonId = $this->currentSeasonId();
        if ($seasonId === null) {
            return [];
        }
        $nd = SoftDelete::notDeletedClause();
        $stmt = $this->pdo->prepare(
            "SELECT price_key, label, category, amount, period, note, enabled, activity_id, season_id
             FROM pricing WHERE season_id = :sid AND {$nd} ORDER BY category, price_key"
        );
        $stmt->execute(['sid' => $seasonId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findByKey(string $key, ?int $seasonId = null): ?array
    {
        $seasonId = $seasonId ?? $this->currentSeasonId();
        if ($seasonId === null) {
            return null;
        }
        $nd = SoftDelete::notDeletedClause();
        $stmt = $this->pdo->prepare(
            "SELECT * FROM pricing WHERE season_id = :sid AND price_key = :key AND {$nd}"
        );
        $stmt->execute(['sid' => $seasonId, 'key' => $key]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function findByKeyPublic(string $key): ?array
    {
        $seasonId = $this->currentSeasonId();
        if ($seasonId === null) {
            return null;
        }
        $nd = SoftDelete::notDeletedClause();
        $stmt = $this->pdo->prepare(
            "SELECT * FROM pricing
             WHERE season_id = :sid AND price_key = :key AND enabled = 1 AND {$nd}"
        );
        $stmt->execute(['sid' => $seasonId, 'key' => $key]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * Tarifs publics groupés + méta saison.
     *
     * @return array{season: ?array, boxing?: array, social?: array}
     */
    public function getGroupedWithSeason(): array
    {
        $seasonModel = new Season($this->pdo);
        $current = $seasonModel->findCurrent();
        $grouped = $this->getGrouped();
        return array_merge(
            [
                'season' => $current ? [
                    'label' => $current['label'],
                    'startsOn' => $current['startsOn'],
                    'endsOn' => $current['endsOn'],
                ] : null,
            ],
            $grouped
        );
    }

    public function getGrouped(): array
    {
        $all = $this->all();
        $grouped = [];

        foreach ($all as $item) {
            $category = $item['category'];
            if (!isset($grouped[$category])) {
                $grouped[$category] = [];
            }

            $keyParts = explode('.', $item['price_key']);
            $finalKey = end($keyParts);
            // Évite les collisions (ex. boxing.a.senior vs boxing.b.senior)
            if ($finalKey === false || $finalKey === '' || isset($grouped[$category][$finalKey])) {
                $finalKey = $item['price_key'];
            }

            $grouped[$category][$finalKey] = [
                'label' => $item['label'],
                'amount' => (float)$item['amount'],
                'period' => $item['period'],
                'note' => $item['note'],
            ];
        }

        return $grouped;
    }

    public function create(array $data): array
    {
        $seasonId = (int)($data['season_id'] ?? $data['seasonId'] ?? 0);
        if ($seasonId < 1) {
            $seasonId = (int)($this->currentSeasonId() ?? 0);
        }
        if ($seasonId < 1) {
            throw new \RuntimeException('Aucune saison disponible.');
        }

        $activityId = $this->normalizeActivityId($data['activity_id'] ?? $data['activityId'] ?? null);

        if ($activityId !== null) {
            $clear = $this->pdo->prepare(
                'UPDATE pricing SET activity_id = NULL
                 WHERE season_id = :sid AND activity_id = :aid AND deleted_at IS NULL'
            );
            $clear->execute(['sid' => $seasonId, 'aid' => $activityId]);
        }

        $stmt = $this->pdo->prepare(
            'INSERT INTO pricing
             (season_id, price_key, label, amount, period, note, category, enabled, activity_id)
             VALUES
             (:season_id, :price_key, :label, :amount, :period, :note, :category, :enabled, :activity_id)'
        );

        $stmt->execute([
            'season_id' => $seasonId,
            'price_key' => $data['price_key'],
            'label' => $data['label'],
            'amount' => $data['amount'],
            'period' => $data['period'] ?? 'an',
            'note' => $data['note'] ?? null,
            'category' => $data['category'] ?? 'boxing',
            'enabled' => isset($data['enabled']) ? (int)$data['enabled'] : 1,
            'activity_id' => $activityId,
        ]);

        $pk = $data['price_key'];
        $this->afterPricingLinkChange($seasonId, $pk, $activityId);

        return $this->findByKey($pk, $seasonId) ?? [];
    }

    public function update(string $key, array $data, ?int $seasonId = null): ?array
    {
        $seasonId = $seasonId ?? (int)($data['season_id'] ?? $data['seasonId'] ?? 0) ?: $this->currentSeasonId();
        if ($seasonId === null) {
            return null;
        }

        $existing = $this->findByKey($key, $seasonId);
        if (!$existing) {
            return null;
        }

        $oldActivityId = $this->normalizeActivityId($existing['activity_id'] ?? null);

        $activityId = array_key_exists('activity_id', $data) || array_key_exists('activityId', $data)
            ? $this->normalizeActivityId($data['activity_id'] ?? $data['activityId'] ?? null)
            : $this->normalizeActivityId($existing['activity_id'] ?? null);

        // Libère uq_pricing_season_activity avant l'UPDATE (sinon 23000)
        if ($activityId !== null) {
            $clear = $this->pdo->prepare(
                'UPDATE pricing SET activity_id = NULL
                 WHERE season_id = :sid AND activity_id = :aid AND price_key != :pk
                   AND deleted_at IS NULL'
            );
            $clear->execute(['sid' => $seasonId, 'aid' => $activityId, 'pk' => $key]);
        }

        $stmt = $this->pdo->prepare(
            'UPDATE pricing SET
                label = :label,
                amount = :amount,
                period = :period,
                note = :note,
                category = :category,
                enabled = :enabled,
                activity_id = :activity_id
             WHERE season_id = :season_id AND price_key = :price_key AND ' . SoftDelete::notDeletedClause()
        );

        $stmt->execute([
            'season_id' => $seasonId,
            'price_key' => $key,
            'label' => $data['label'],
            'amount' => $data['amount'],
            'period' => $data['period'] ?? 'an',
            'note' => $data['note'] ?? null,
            'category' => $data['category'] ?? 'boxing',
            'enabled' => isset($data['enabled']) ? (int)$data['enabled'] : 1,
            'activity_id' => $activityId,
        ]);

        $currentId = $this->currentSeasonId();
        if ($currentId !== null && (int)$seasonId === (int)$currentId) {
            if ($oldActivityId && (
                $activityId === null
                || (string)$oldActivityId !== (string)$activityId
            )) {
                $un = $this->pdo->prepare(
                    'UPDATE activities SET meta_price_key = NULL WHERE id = :id AND meta_price_key = :pk'
                );
                $un->execute(['id' => $oldActivityId, 'pk' => $key]);
            }
            $this->afterPricingLinkChange($seasonId, $key, $activityId);
        } elseif ($activityId) {
            // Saison archivée : seulement désambiguïser les liens (déjà fait ci-dessus)
        }

        return $this->findByKey($key, $seasonId);
    }

    public function delete(string $key, ?int $seasonId = null): bool
    {
        $seasonId = $seasonId ?? $this->currentSeasonId();
        if ($seasonId === null) {
            return false;
        }

        $currentId = $this->currentSeasonId();
        if ($currentId !== null && (int)$seasonId === (int)$currentId) {
            $this->clearActivityMetaForPriceKey($key);
        }

        // Libère uq_pricing_season_key / uq_pricing_season_activity pendant la rétention corbeille.
        $suffix = '__trash_' . time();
        $maxBase = max(1, 100 - strlen($suffix));
        $trashKey = substr($key, 0, $maxBase) . $suffix;

        $stmt = $this->pdo->prepare(
            'UPDATE pricing
             SET price_key = :trashKey, activity_id = NULL, deleted_at = NOW()
             WHERE season_id = :sid AND price_key = :key AND deleted_at IS NULL'
        );
        $stmt->execute(['trashKey' => $trashKey, 'sid' => $seasonId, 'key' => $key]);
        return $stmt->rowCount() > 0;
    }

    public function trash(?int $seasonId = null): array
    {
        $where = SoftDelete::inTrashClause();
        if ($seasonId !== null) {
            $stmt = $this->pdo->prepare(
                "SELECT * FROM pricing WHERE season_id = :sid AND {$where} ORDER BY deleted_at DESC"
            );
            $stmt->execute(['sid' => $seasonId]);
        } else {
            $stmt = $this->pdo->query(
                "SELECT * FROM pricing WHERE {$where} ORDER BY deleted_at DESC"
            );
        }
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function restore(string $key, ?int $seasonId = null): bool
    {
        $seasonId = $seasonId ?? $this->currentSeasonId();
        if ($seasonId === null) {
            return false;
        }
        $where = SoftDelete::inTrashClause();
        $stmt = $this->pdo->prepare(
            "UPDATE pricing SET deleted_at = NULL
             WHERE season_id = :sid AND price_key = :key AND {$where}"
        );
        $stmt->execute(['sid' => $seasonId, 'key' => $key]);
        return $stmt->rowCount() > 0;
    }

    /** Compatibilité TrashActions::restoreItem — restore par id numérique. */
    public function restoreById(int $id): bool
    {
        $where = SoftDelete::inTrashClause();
        $find = $this->pdo->prepare("SELECT * FROM pricing WHERE id = :id AND {$where}");
        $find->execute(['id' => $id]);
        $row = $find->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return false;
        }

        $trashKey = (string)$row['price_key'];
        $original = preg_replace('/__trash_\d+$/', '', $trashKey) ?: $trashKey;
        $seasonId = (int)$row['season_id'];

        if ($original !== $trashKey) {
            $busy = $this->pdo->prepare(
                'SELECT 1 FROM pricing
                 WHERE season_id = :sid AND price_key = :key AND deleted_at IS NULL LIMIT 1'
            );
            $busy->execute(['sid' => $seasonId, 'key' => $original]);
            if (!$busy->fetchColumn()) {
                $stmt = $this->pdo->prepare(
                    "UPDATE pricing SET price_key = :orig, deleted_at = NULL
                     WHERE id = :id AND {$where}"
                );
                $stmt->execute(['orig' => $original, 'id' => $id]);
                return $stmt->rowCount() > 0;
            }
        }

        $stmt = $this->pdo->prepare(
            "UPDATE pricing SET deleted_at = NULL WHERE id = :id AND {$where}"
        );
        $stmt->execute(['id' => $id]);
        return $stmt->rowCount() > 0;
    }

    public function findById(int $id): ?array
    {
        $nd = SoftDelete::notDeletedClause();
        $stmt = $this->pdo->prepare("SELECT * FROM pricing WHERE id = :id AND {$nd}");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function bulkUpdate(array $pricings, ?int $seasonId = null): bool
    {
        $seasonId = $seasonId ?? $this->currentSeasonId();
        if ($seasonId === null) {
            return false;
        }

        $this->pdo->beginTransaction();

        try {
            $insert = $this->pdo->prepare(
                'INSERT INTO pricing
                 (season_id, price_key, label, amount, period, note, category, enabled, activity_id, deleted_at)
                 VALUES
                 (:season_id, :price_key, :label, :amount, :period, :note, :category, :enabled, :activity_id, NULL)'
            );
            $update = $this->pdo->prepare(
                'UPDATE pricing SET
                    label = :label,
                    amount = :amount,
                    period = :period,
                    note = :note,
                    category = :category,
                    enabled = :enabled,
                    activity_id = :activity_id,
                    deleted_at = NULL,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE season_id = :season_id AND price_key = :price_key'
            );
            // Ligne soft-supprimée legacy (même clé) encore présente
            $resurrect = $this->pdo->prepare(
                'UPDATE pricing SET
                    label = :label,
                    amount = :amount,
                    period = :period,
                    note = :note,
                    category = :category,
                    enabled = :enabled,
                    activity_id = :activity_id,
                    deleted_at = NULL,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE season_id = :season_id AND price_key = :price_key AND deleted_at IS NOT NULL'
            );

            $currentId = $this->currentSeasonId();
            $isCurrentSeason = $currentId !== null && (int)$seasonId === (int)$currentId;

            foreach ($pricings as $pricing) {
                $activityId = $this->normalizeActivityId($pricing['activity_id'] ?? $pricing['activityId'] ?? null);
                $priceKey = trim((string)$pricing['price_key']);
                if ($priceKey === '') {
                    throw new \InvalidArgumentException('Clé tarif manquante dans le lot.');
                }

                $payload = [
                    'season_id' => $seasonId,
                    'price_key' => $priceKey,
                    'label' => $pricing['label'],
                    'amount' => $pricing['amount'],
                    'period' => $pricing['period'] ?? 'an',
                    'note' => $pricing['note'] ?? null,
                    'category' => $pricing['category'] ?? 'boxing',
                    'enabled' => isset($pricing['enabled']) ? (int)$pricing['enabled'] : 1,
                    'activity_id' => $activityId,
                ];

                // Libère uq_pricing_season_activity avant écriture (évite upsert sur la mauvaise ligne)
                if ($activityId !== null) {
                    $clear = $this->pdo->prepare(
                        'UPDATE pricing SET activity_id = NULL
                         WHERE season_id = :sid AND activity_id = :aid AND price_key != :pk
                           AND deleted_at IS NULL'
                    );
                    $clear->execute(['sid' => $seasonId, 'aid' => $activityId, 'pk' => $priceKey]);
                }

                $existing = $this->findByKey($priceKey, $seasonId);
                $oldActivityId = $existing
                    ? $this->normalizeActivityId($existing['activity_id'] ?? null)
                    : null;

                if ($existing) {
                    $update->execute($payload);
                } else {
                    try {
                        $insert->execute($payload);
                    } catch (\PDOException $e) {
                        if ((int)$e->getCode() !== 23000) {
                            throw $e;
                        }
                        // Conflit : souvent une ligne soft-deleted legacy avec la même clé
                        $resurrect->execute($payload);
                        if ($resurrect->rowCount() < 1) {
                            throw $e;
                        }
                    }
                }

                if ($isCurrentSeason) {
                    if ($oldActivityId && (
                        $activityId === null
                        || (string)$oldActivityId !== (string)$activityId
                    )) {
                        $un = $this->pdo->prepare(
                            'UPDATE activities SET meta_price_key = NULL WHERE id = :id AND meta_price_key = :pk'
                        );
                        $un->execute(['id' => $oldActivityId, 'pk' => $priceKey]);
                    }
                    $this->afterPricingLinkChange($seasonId, $priceKey, $activityId);
                }
            }

            $this->pdo->commit();
            return true;
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            if ($e instanceof \InvalidArgumentException) {
                throw $e;
            }
            error_log('[afboxing] pricing bulkUpdate: ' . $e->getMessage());
            return false;
        }
    }

    private function normalizeActivityId(mixed $raw): ?string
    {
        if ($raw === null || $raw === '') {
            return null;
        }
        $s = trim((string)$raw);

        return $s === '' ? null : $s;
    }

    private function afterPricingLinkChange(int $seasonId, string $priceKey, ?string $activityId): void
    {
        if (!$activityId) {
            return;
        }

        $clear = $this->pdo->prepare(
            'UPDATE pricing SET activity_id = NULL
             WHERE season_id = :sid AND activity_id = :aid AND price_key != :pk'
        );
        $clear->execute(['sid' => $seasonId, 'aid' => $activityId, 'pk' => $priceKey]);

        $currentId = $this->currentSeasonId();
        if ($currentId !== null && (int)$seasonId === (int)$currentId) {
            $u = $this->pdo->prepare(
                'UPDATE activities SET meta_price_key = :pk WHERE id = :aid'
            );
            $u->execute(['pk' => $priceKey, 'aid' => $activityId]);
        }
    }

    private function clearActivityMetaForPriceKey(string $priceKey): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE activities SET meta_price_key = NULL WHERE meta_price_key = :pk'
        );
        $stmt->execute(['pk' => $priceKey]);
    }

    /** Détache tous les tarifs liés à une activité (soft-delete activité). */
    public function clearActivityId(string $activityId): int
    {
        $stmt = $this->pdo->prepare(
            'UPDATE pricing SET activity_id = NULL WHERE activity_id = :aid AND deleted_at IS NULL'
        );
        $stmt->execute(['aid' => $activityId]);
        $count = $stmt->rowCount();

        $meta = $this->pdo->prepare(
            'UPDATE activities SET meta_price_key = NULL WHERE id = :aid'
        );
        $meta->execute(['aid' => $activityId]);

        return $count;
    }
}
