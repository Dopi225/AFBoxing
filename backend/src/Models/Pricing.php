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

    public function all(): array
    {
        $nd = SoftDelete::notDeletedClause('p');
        $stmt = $this->pdo->query(
            "SELECT p.* FROM pricing p WHERE p.enabled = 1 AND {$nd} ORDER BY p.category, p.price_key"
        );
        return $stmt->fetchAll();
    }

    /** Liste détaillée admin (jointure activité). */
    public function listDetailedForAdmin(): array
    {
        $nd = SoftDelete::notDeletedClause('p');
        $stmt = $this->pdo->query(
            "SELECT p.*, a.title AS activity_title
             FROM pricing p
             LEFT JOIN activities a ON a.id = p.activity_id AND a.deleted_at IS NULL
             WHERE {$nd}
             ORDER BY p.category, p.price_key"
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /** Liste plate pour les listes déroulantes admin (tous statuts). */
    public function catalogForAdmin(): array
    {
        $nd = SoftDelete::notDeletedClause();
        $stmt = $this->pdo->query(
            "SELECT price_key, label, category, amount, period, note, enabled, activity_id
             FROM pricing WHERE {$nd} ORDER BY category, price_key"
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findByCategory(string $category): array
    {
        $nd = SoftDelete::notDeletedClause();
        $stmt = $this->pdo->prepare(
            "SELECT * FROM pricing WHERE category = :category AND enabled = 1 AND {$nd} ORDER BY price_key"
        );
        $stmt->execute(['category' => $category]);
        return $stmt->fetchAll();
    }

    public function findByKey(string $key): ?array
    {
        $nd = SoftDelete::notDeletedClause();
        $stmt = $this->pdo->prepare("SELECT * FROM pricing WHERE price_key = :key AND {$nd}");
        $stmt->execute(['key' => $key]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /** Tarif exposé sur l’API publique GET /api/pricing/{key} (uniquement si activé). */
    public function findByKeyPublic(string $key): ?array
    {
        $nd = SoftDelete::notDeletedClause();
        $stmt = $this->pdo->prepare(
            "SELECT * FROM pricing WHERE price_key = :key AND enabled = 1 AND {$nd}"
        );
        $stmt->execute(['key' => $key]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
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

            $grouped[$category][$finalKey] = [
                'label' => $item['label'],
                'amount' => (float)$item['amount'],
                'period' => $item['period'],
                'note' => $item['note']
            ];
        }

        return $grouped;
    }

    public function create(array $data): array
    {
        $activityId = $this->normalizeActivityId($data['activity_id'] ?? $data['activityId'] ?? null);

        $stmt = $this->pdo->prepare(
            'INSERT INTO pricing (price_key, label, amount, period, note, category, enabled, activity_id)
             VALUES (:price_key, :label, :amount, :period, :note, :category, :enabled, :activity_id)'
        );

        $stmt->execute([
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
        $this->afterPricingLinkChange($pk, $activityId);

        return $this->findByKey($pk);
    }

    public function update(string $key, array $data): ?array
    {
        $existing = $this->findByKey($key);
        if (!$existing) {
            return null;
        }

        $oldActivityId = $this->normalizeActivityId($existing['activity_id'] ?? null);

        $activityId = array_key_exists('activity_id', $data) || array_key_exists('activityId', $data)
            ? $this->normalizeActivityId($data['activity_id'] ?? $data['activityId'] ?? null)
            : $this->normalizeActivityId($existing['activity_id'] ?? null);

        $stmt = $this->pdo->prepare(
            'UPDATE pricing SET
            label = :label,
            amount = :amount,
            period = :period,
            note = :note,
            category = :category,
            enabled = :enabled,
            activity_id = :activity_id
            WHERE price_key = :price_key'
        );

        $stmt->execute([
            'price_key' => $key,
            'label' => $data['label'],
            'amount' => $data['amount'],
            'period' => $data['period'] ?? 'an',
            'note' => $data['note'] ?? null,
            'category' => $data['category'] ?? 'boxing',
            'enabled' => isset($data['enabled']) ? (int)$data['enabled'] : 1,
            'activity_id' => $activityId,
        ]);

        if ($oldActivityId && (
            $activityId === null
            || (string)$oldActivityId !== (string)$activityId
        )) {
            $un = $this->pdo->prepare(
                'UPDATE activities SET meta_price_key = NULL WHERE id = :id AND meta_price_key = :pk'
            );
            $un->execute(['id' => $oldActivityId, 'pk' => $key]);
        }

        $this->afterPricingLinkChange($key, $activityId);

        return $this->findByKey($key);
    }

    public function delete(string $key): bool
    {
        $this->clearActivityMetaForPriceKey($key);
        return SoftDelete::softDelete($this->pdo, 'pricing', 'price_key', $key);
    }

    public function trash(): array
    {
        $where = SoftDelete::inTrashClause();
        $stmt = $this->pdo->query("SELECT * FROM pricing WHERE {$where} ORDER BY deleted_at DESC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function restore(string $key): bool
    {
        return SoftDelete::restore($this->pdo, 'pricing', 'price_key', $key);
    }

    public function bulkUpdate(array $pricings): bool
    {
        $this->pdo->beginTransaction();

        try {
            $stmt = $this->pdo->prepare(
                'INSERT INTO pricing (price_key, label, amount, period, note, category, enabled, activity_id)
                 VALUES (:price_key, :label, :amount, :period, :note, :category, :enabled, :activity_id)
                 ON DUPLICATE KEY UPDATE
                 label = VALUES(label),
                 amount = VALUES(amount),
                 period = VALUES(period),
                 note = VALUES(note),
                 category = VALUES(category),
                 enabled = VALUES(enabled),
                 activity_id = VALUES(activity_id),
                 updated_at = CURRENT_TIMESTAMP'
            );

            foreach ($pricings as $pricing) {
                $stmt->execute([
                    'price_key' => $pricing['price_key'],
                    'label' => $pricing['label'],
                    'amount' => $pricing['amount'],
                    'period' => $pricing['period'] ?? 'an',
                    'note' => $pricing['note'] ?? null,
                    'category' => $pricing['category'] ?? 'boxing',
                    'enabled' => isset($pricing['enabled']) ? (int)$pricing['enabled'] : 1,
                    'activity_id' => $this->normalizeActivityId($pricing['activity_id'] ?? $pricing['activityId'] ?? null),
                ]);
            }

            $this->pdo->commit();
            return true;
        } catch (\Exception $e) {
            $this->pdo->rollBack();
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

    /** Dédoublonne les autres lignes tarif qui pointaient vers la même activité, puis met meta_price_key sur l’activité. */
    private function afterPricingLinkChange(string $priceKey, ?string $activityId): void
    {
        if ($activityId) {
            $clear = $this->pdo->prepare(
                'UPDATE pricing SET activity_id = NULL WHERE activity_id = :aid AND price_key != :pk'
            );
            $clear->execute(['aid' => $activityId, 'pk' => $priceKey]);

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
}
