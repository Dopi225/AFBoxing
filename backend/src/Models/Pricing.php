<?php

declare(strict_types=1);

namespace AFBoxing\Models;

use PDO;

class Pricing
{
    public function __construct(private PDO $pdo)
    {
    }

    public function all(): array
    {
        $stmt = $this->pdo->query(
            'SELECT * FROM pricing WHERE enabled = 1 ORDER BY category, price_key'
        );
        return $stmt->fetchAll();
    }

    public function findByCategory(string $category): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM pricing WHERE category = :category AND enabled = 1 ORDER BY price_key'
        );
        $stmt->execute(['category' => $category]);
        return $stmt->fetchAll();
    }

    public function findByKey(string $key): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM pricing WHERE price_key = :key');
        $stmt->execute(['key' => $key]);
        $row = $stmt->fetch();
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
            
            // Extraire la clé finale (ex: "educative" depuis "boxing.educative")
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
        $stmt = $this->pdo->prepare(
            'INSERT INTO pricing (price_key, label, amount, period, note, category, enabled)
             VALUES (:price_key, :label, :amount, :period, :note, :category, :enabled)'
        );
        
        $stmt->execute([
            'price_key' => $data['price_key'],
            'label' => $data['label'],
            'amount' => $data['amount'],
            'period' => $data['period'] ?? 'an',
            'note' => $data['note'] ?? null,
            'category' => $data['category'] ?? 'boxing',
            'enabled' => isset($data['enabled']) ? (int)$data['enabled'] : 1
        ]);

        return $this->findByKey($data['price_key']);
    }

    public function update(string $key, array $data): ?array
    {
        $stmt = $this->pdo->prepare(
            'UPDATE pricing SET
            label = :label,
            amount = :amount,
            period = :period,
            note = :note,
            category = :category,
            enabled = :enabled
            WHERE price_key = :price_key'
        );
        
        $stmt->execute([
            'price_key' => $key,
            'label' => $data['label'],
            'amount' => $data['amount'],
            'period' => $data['period'] ?? 'an',
            'note' => $data['note'] ?? null,
            'category' => $data['category'] ?? 'boxing',
            'enabled' => isset($data['enabled']) ? (int)$data['enabled'] : 1
        ]);

        return $this->findByKey($key);
    }

    public function delete(string $key): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM pricing WHERE price_key = :key');
        $stmt->execute(['key' => $key]);
        return $stmt->rowCount() > 0;
    }

    public function bulkUpdate(array $pricings): bool
    {
        $this->pdo->beginTransaction();
        
        try {
            $stmt = $this->pdo->prepare(
                'INSERT INTO pricing (price_key, label, amount, period, note, category, enabled)
                 VALUES (:price_key, :label, :amount, :period, :note, :category, :enabled)
                 ON DUPLICATE KEY UPDATE
                 label = VALUES(label),
                 amount = VALUES(amount),
                 period = VALUES(period),
                 note = VALUES(note),
                 category = VALUES(category),
                 enabled = VALUES(enabled),
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
                    'enabled' => isset($pricing['enabled']) ? (int)$pricing['enabled'] : 1
                ]);
            }
            
            $this->pdo->commit();
            return true;
        } catch (\Exception $e) {
            $this->pdo->rollBack();
            return false;
        }
    }
}

