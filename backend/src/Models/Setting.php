<?php

declare(strict_types=1);

namespace AFBoxing\Models;

use PDO;

class Setting
{
    public function __construct(private PDO $pdo)
    {
    }

    public function all(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM settings ORDER BY category, setting_key');
        return $stmt->fetchAll();
    }

    public function findByCategory(string $category): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM settings WHERE category = :category ORDER BY setting_key');
        $stmt->execute(['category' => $category]);
        return $stmt->fetchAll();
    }

    public function get(string $key): ?string
    {
        $stmt = $this->pdo->prepare('SELECT setting_value FROM settings WHERE setting_key = :key');
        $stmt->execute(['key' => $key]);
        $row = $stmt->fetch();
        return $row ? $row['setting_value'] : null;
    }

    public function set(string $key, string $value, string $category = 'general'): bool
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO settings (setting_key, setting_value, category)
             VALUES (:key, :value, :category)
             ON DUPLICATE KEY UPDATE setting_value = :value, updated_at = CURRENT_TIMESTAMP'
        );
        
        return $stmt->execute([
            'key' => $key,
            'value' => $value,
            'category' => $category
        ]);
    }

    public function bulkUpdate(array $settings): bool
    {
        $this->pdo->beginTransaction();
        
        try {
            $stmt = $this->pdo->prepare(
                'INSERT INTO settings (setting_key, setting_value, category)
                 VALUES (:key, :value, :category)
                 ON DUPLICATE KEY UPDATE setting_value = :value, updated_at = CURRENT_TIMESTAMP'
            );
            
            foreach ($settings as $setting) {
                $stmt->execute([
                    'key' => $setting['key'],
                    'value' => $setting['value'],
                    'category' => $setting['category'] ?? 'general'
                ]);
            }
            
            $this->pdo->commit();
            return true;
        } catch (\Exception $e) {
            $this->pdo->rollBack();
            return false;
        }
    }

    public function delete(string $key): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM settings WHERE setting_key = :key');
        $stmt->execute(['key' => $key]);
        return $stmt->rowCount() > 0;
    }

    public function getGrouped(): array
    {
        $all = $this->all();
        $grouped = [];
        
        foreach ($all as $setting) {
            $category = $setting['category'];
            if (!isset($grouped[$category])) {
                $grouped[$category] = [];
            }
            $grouped[$category][$setting['setting_key']] = $setting['setting_value'];
        }
        
        return $grouped;
    }
}

