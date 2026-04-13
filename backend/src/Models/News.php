<?php

declare(strict_types=1);

namespace AFBoxing\Models;

use PDO;

class News
{
    public function __construct(private PDO $pdo)
    {
    }

    public function all(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM news ORDER BY date DESC, created_at DESC');
        return $stmt->fetchAll();
    }

    public function countAll(): int
    {
        $stmt = $this->pdo->query('SELECT COUNT(*) FROM news');
        return (int) $stmt->fetchColumn();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function paginate(int $page, int $perPage): array
    {
        $offset = max(0, ($page - 1) * $perPage);
        $stmt = $this->pdo->prepare(
            'SELECT * FROM news ORDER BY date DESC, created_at DESC LIMIT :limit OFFSET :offset'
        );
        $stmt->bindValue(':limit', $perPage, \PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function find(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM news WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(array $data): array
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO news (title, date, summary, description, image, created_at) 
             VALUES (:title, :date, :summary, :description, :image, NOW())'
        );
        $stmt->execute([
            'title' => $data['title'],
            'date' => $data['date'],
            'summary' => $data['summary'],
            'description' => $data['description'],
            'image' => $data['image'] ?? null,
        ]);

        return $this->find((int)$this->pdo->lastInsertId());
    }

    public function update(int $id, array $data): ?array
    {
        $stmt = $this->pdo->prepare(
            'UPDATE news 
             SET title = :title, date = :date, summary = :summary, description = :description, image = :image 
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $id,
            'title' => $data['title'],
            'date' => $data['date'],
            'summary' => $data['summary'],
            'description' => $data['description'],
            'image' => $data['image'] ?? null,
        ]);

        return $this->find($id);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM news WHERE id = :id');
        return $stmt->execute(['id' => $id]);
    }
}


