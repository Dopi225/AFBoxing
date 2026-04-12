<?php

declare(strict_types=1);

namespace AFBoxing\Models;

use PDO;

class Schedule
{
    public function __construct(private PDO $pdo)
    {
    }

    public function all(): array
    {
        $stmt = $this->pdo->query(
            'SELECT id, day, time_range AS time, activity, level 
             FROM schedule 
             ORDER BY FIELD(day, "Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"), time_range'
        );
        return $stmt->fetchAll();
    }

    public function create(array $data): array
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO schedule (day, time_range, activity, level)
             VALUES (:day, :time_range, :activity, :level)'
        );
        $stmt->execute([
            'day' => $data['day'],
            'time_range' => $data['time'],
            'activity' => $data['activity'],
            'level' => $data['level'] ?? null,
        ]);

        $id = (int)$this->pdo->lastInsertId();
        return $this->find($id) ?? [];
    }

    public function find(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT id, day, time_range AS time, activity, level FROM schedule WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function update(int $id, array $data): ?array
    {
        $stmt = $this->pdo->prepare(
            'UPDATE schedule SET day = :day, time_range = :time_range, activity = :activity, level = :level
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $id,
            'day' => $data['day'],
            'time_range' => $data['time'],
            'activity' => $data['activity'],
            'level' => $data['level'] ?? null,
        ]);

        return $this->find($id);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM schedule WHERE id = :id');
        return $stmt->execute(['id' => $id]);
    }
}


