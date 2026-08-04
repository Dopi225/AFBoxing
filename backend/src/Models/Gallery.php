<?php

declare(strict_types=1);

namespace AFBoxing\Models;

use AFBoxing\Core\SoftDelete;
use PDO;

class Gallery
{
    public function __construct(private PDO $pdo)
    {
    }

    public function all(): array
    {
        $where = SoftDelete::notDeletedClause();
        $stmt = $this->pdo->query("SELECT * FROM gallery WHERE {$where} ORDER BY created_at DESC");
        return $stmt->fetchAll();
    }

    public function find(int $id): ?array
    {
        $where = SoftDelete::notDeletedClause();
        $stmt = $this->pdo->prepare("SELECT * FROM gallery WHERE id = :id AND {$where}");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
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
        return $this->find($id) ?: [];
    }

    public function update(int $id, array $data): ?array
    {
        $stmt = $this->pdo->prepare(
            'UPDATE gallery SET
            title = :title,
            description = :description,
            image = :image,
            category = :category
            WHERE id = :id AND ' . SoftDelete::notDeletedClause()
        );
        
        $stmt->execute([
            'id' => $id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'image' => $data['image'],
            'category' => $data['category'] ?? null,
        ]);

        return $this->find($id);
    }

    public function delete(int $id): bool
    {
        return SoftDelete::softDelete($this->pdo, 'gallery', 'id', $id);
    }

    public function trash(): array
    {
        $where = SoftDelete::inTrashClause();
        $stmt = $this->pdo->query("SELECT * FROM gallery WHERE {$where} ORDER BY deleted_at DESC");
        return $stmt->fetchAll();
    }

    public function restore(int $id): bool
    {
        return SoftDelete::restore($this->pdo, 'gallery', 'id', $id);
    }
}
