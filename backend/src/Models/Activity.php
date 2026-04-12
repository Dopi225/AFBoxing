<?php

declare(strict_types=1);

namespace AFBoxing\Models;

use PDO;

class Activity
{
    public function __construct(private PDO $pdo)
    {
    }

    public function all(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM activities ORDER BY kind, title');
        $results = $stmt->fetchAll();
        
        return array_map([$this, 'formatActivity'], $results);
    }

    public function find(string $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM activities WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        
        return $row ? $this->formatActivity($row) : null;
    }

    public function create(array $data): array
{
    $meta = $data['meta'] ?? [];
    $sectionsJson = isset($data['sections']) ? json_encode($data['sections'], JSON_UNESCAPED_UNICODE) : null;

    $insertData = [
        'id' => $data['id'] ?? null,
        'kind' => $data['kind'] ?? 'boxing',
        'title' => $data['title'] ?? null,
        'eyebrow' => $data['eyebrow'] ?? null,
        'subtitle' => $data['subtitle'] ?? null,
        'schedule_activity_name' => $data['scheduleActivityName'] ?? null,
        'meta_age' => $meta['age'] ?? null,
        'meta_equipment' => $meta['equipment'] ?? null,
        'meta_price_key' => $meta['priceKey'] ?? null,
        'sections' => $sectionsJson,
        'icon' => $data['icon'] ?? null,
        'image' => $data['image'] ?? null,
        'enabled' => isset($data['enabled']) ? (int)$data['enabled'] : 1,
    ];

    // Supprimer les champs null pour ne pas essayer de les insérer
    $insertData = array_filter($insertData, fn($v) => $v !== null);

    $columns = implode(', ', array_keys($insertData));
    $placeholders = implode(', ', array_map(fn($k) => ':' . $k, array_keys($insertData)));

    $stmt = $this->pdo->prepare("INSERT INTO activities ($columns) VALUES ($placeholders)");
    $stmt->execute($insertData);

    return $this->find($data['id']);
}

    public function update(string $id, array $data): ?array
    {
        $sectionsJson = isset($data['sections']) ? json_encode($data['sections'], JSON_UNESCAPED_UNICODE) : null;
        
        $stmt = $this->pdo->prepare(
            'UPDATE activities SET
            kind = :kind,
            title = :title,
            eyebrow = :eyebrow,
            subtitle = :subtitle,
            schedule_activity_name = :schedule_activity_name,
            meta_age = :meta_age,
            meta_equipment = :meta_equipment,
            meta_price_key = :meta_price_key,
            sections = :sections,
            icon = :icon,
            image = :image,
            enabled = :enabled
            WHERE id = :id'
        );
        
        $meta = $data['meta'] ?? [];
        
        $stmt->execute([
            'id' => $id,
            'kind' => $data['kind'] ?? 'boxing',
            'title' => $data['title'],
            'eyebrow' => $data['eyebrow'] ?? null,
            'subtitle' => $data['subtitle'],
            'schedule_activity_name' => $data['scheduleActivityName'] ?? null,
            'meta_age' => $meta['age'] ?? null,
            'meta_equipment' => $meta['equipment'] ?? null,
            'meta_price_key' => $meta['priceKey'] ?? null,
            'sections' => $sectionsJson,
            'icon' => $data['icon'] ?? null,
            'image' => $data['image'] ?? null,
            'enabled' => isset($data['enabled']) ? (int)$data['enabled'] : 1
        ]);

        return $this->find($id);
    }

    public function delete(string $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM activities WHERE id = :id');
        $stmt->execute(['id' => $id]);
        return $stmt->rowCount() > 0;
    }

    private function formatActivity(array $row): array
    {
        $sections = $row['sections'] ? json_decode($row['sections'], true) : [];
        
        return [
            'id' => $row['id'],
            'kind' => $row['kind'],
            'title' => $row['title'],
            'eyebrow' => $row['eyebrow'],
            'subtitle' => $row['subtitle'],
            'scheduleActivityName' => $row['schedule_activity_name'],
            'meta' => [
                'age' => $row['meta_age'],
                'equipment' => $row['meta_equipment'],
                'priceKey' => $row['meta_price_key']
            ],
            'sections' => $sections,
            'icon' => $row['icon'],
            'image' => $row['image'],
            'enabled' => (bool)$row['enabled'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at']
        ];
    }
}

