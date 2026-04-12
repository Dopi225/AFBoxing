<?php

declare(strict_types=1);

namespace AFBoxing\Models;

use PDO;

class Gallery
{
    public function __construct(private PDO $pdo)
    {
    }

    public function all(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM gallery ORDER BY created_at DESC');
        return $stmt->fetchAll();
    }

    public function create(array $data): array
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO gallery (title, description, image, category, created_at) 
             VALUES (:title, :description, :image, :category, NOW())'
        );
        $stmt->execute([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'image' => $data['image'],
            'category' => $data['category'] ?? null,
        ]);

        $id = (int)$this->pdo->lastInsertId();
        $stmt = $this->pdo->prepare('SELECT * FROM gallery WHERE id = :id');
        $stmt->execute(['id' => $id]);
        return $stmt->fetch() ?: [];
    }

    public function update(int $id, array $data): ?array
    {
        $stmt = $this->pdo->prepare(
            'UPDATE gallery SET
            title = :title,
            description = :description,
            image = :image,
            category = :category,
            updated_at = NOW()
            WHERE id = :id'
        );
        
        $stmt->execute([
            'id' => $id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'image' => $data['image'],
            'category' => $data['category'] ?? null,
        ]);

        $stmt = $this->pdo->prepare('SELECT * FROM gallery WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM gallery WHERE id = :id');
        return $stmt->execute(['id' => $id]);
    }
}


