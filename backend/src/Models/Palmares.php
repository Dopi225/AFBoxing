<?php

declare(strict_types=1);

namespace AFBoxing\Models;

use PDO;

class Palmares
{
    public function __construct(private PDO $pdo)
    {
    }

    public function all(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM palmares ORDER BY date DESC, id DESC');
        return $stmt->fetchAll();
    }

    public function find(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM palmares WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(array $data): array
    {
        $year = (int)date('Y', strtotime($data['date']));

        $stmt = $this->pdo->prepare(
            'INSERT INTO palmares (title, date, location, category, result, boxer, details, image, year)
             VALUES (:title, :date, :location, :category, :result, :boxer, :details, :image, :year)'
        );
        $stmt->execute([
            'title' => $data['title'],
            'date' => $data['date'],
            'location' => $data['location'],
            'category' => $data['category'],
            'result' => $data['result'],
            'boxer' => $data['boxer'],
            'details' => $data['details'],
            'image' => $data['image'] ?? null,
            'year' => $year,
        ]);

        return $this->find((int)$this->pdo->lastInsertId()) ?? [];
    }

    public function update(int $id, array $data): ?array
    {
        $year = (int)date('Y', strtotime($data['date']));

        $stmt = $this->pdo->prepare(
            'UPDATE palmares 
             SET title = :title, date = :date, location = :location, category = :category, 
                 result = :result, boxer = :boxer, details = :details, image = :image, year = :year
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $id,
            'title' => $data['title'],
            'date' => $data['date'],
            'location' => $data['location'],
            'category' => $data['category'],
            'result' => $data['result'],
            'boxer' => $data['boxer'],
            'details' => $data['details'],
            'image' => $data['image'] ?? null,
            'year' => $year,
        ]);

        return $this->find($id);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM palmares WHERE id = :id');
        return $stmt->execute(['id' => $id]);
    }
}


