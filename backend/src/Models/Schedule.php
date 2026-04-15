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
            'SELECT s.id, s.day, s.time_range AS time, s.activity, s.level, s.activity_id AS activityId
             FROM schedule s
             ORDER BY FIELD(s.day, "Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"), s.time_range'
        );
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_map([$this, 'formatRow'], $rows);
    }

    /**
     * @param array{day:string,time:string,activity:string,level?:?string,activity_id?:?string} $data
     */
    public function create(array $data): array
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO schedule (day, time_range, activity, level, activity_id)
             VALUES (:day, :time_range, :activity, :level, :activity_id)'
        );
        $stmt->execute([
            'day' => $data['day'],
            'time_range' => $data['time'],
            'activity' => $data['activity'],
            'level' => $data['level'] ?? null,
            'activity_id' => $data['activity_id'] ?? null,
        ]);

        $id = (int)$this->pdo->lastInsertId();
        return $this->find($id) ?? [];
    }

    public function find(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT s.id, s.day, s.time_range AS time, s.activity, s.level, s.activity_id AS activityId
             FROM schedule s WHERE s.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? $this->formatRow($row) : null;
    }

    /**
     * @param array{day:string,time:string,activity:string,level?:?string,activity_id?:?string} $data
     */
    public function update(int $id, array $data): ?array
    {
        $stmt = $this->pdo->prepare(
            'UPDATE schedule SET day = :day, time_range = :time_range, activity = :activity, level = :level, activity_id = :activity_id
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $id,
            'day' => $data['day'],
            'time_range' => $data['time'],
            'activity' => $data['activity'],
            'level' => $data['level'] ?? null,
            'activity_id' => $data['activity_id'] ?? null,
        ]);

        return $this->find($id);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM schedule WHERE id = :id');
        return $stmt->execute(['id' => $id]);
    }

    private function formatRow(array $row): array
    {
        $aid = $row['activityId'] ?? $row['activity_id'] ?? null;

        return [
            'id' => (int)$row['id'],
            'day' => $row['day'],
            'time' => $row['time'],
            'activity' => $row['activity'],
            'level' => $row['level'],
            'activityId' => $aid !== null && $aid !== '' ? (string)$aid : null,
        ];
    }
}
