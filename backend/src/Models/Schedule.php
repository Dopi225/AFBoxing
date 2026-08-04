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
            'SELECT s.id, s.day, s.time_range AS time, s.activity, s.level, s.activity_id AS activityId,
                    a.enabled AS activity_enabled,
                    COALESCE(NULLIF(TRIM(a.schedule_activity_name), \'\'), NULLIF(TRIM(a.title), \'\'), s.activity) AS resolved_activity
             FROM schedule s
             LEFT JOIN activities a ON a.id = s.activity_id AND a.deleted_at IS NULL
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

    /**
     * Remplace tout le planning de façon atomique (transaction).
     *
     * @param list<array{day:string,time:string,activity:string,level?:?string,activity_id?:?string}> $rows
     * @return list<array<string,mixed>>
     */
    public function replaceAll(array $rows): array
    {
        $this->pdo->beginTransaction();
        try {
            $this->pdo->exec('DELETE FROM schedule');

            $created = [];
            foreach ($rows as $data) {
                $created[] = $this->create($data);
            }

            $this->pdo->commit();
            return $created;
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }

    /** Détache ou retire les créneaux liés à une activité (soft-delete activité). */
    public function clearActivityId(string $activityId): int
    {
        // Supprime les créneaux liés (évite orphelins visibles sur le site public)
        $stmt = $this->pdo->prepare('DELETE FROM schedule WHERE activity_id = :aid');
        $stmt->execute(['aid' => $activityId]);
        return $stmt->rowCount();
    }

    private function formatRow(array $row): array
    {
        $aid = $row['activityId'] ?? $row['activity_id'] ?? null;
        $enabled = array_key_exists('activity_enabled', $row) ? $row['activity_enabled'] : null;
        $label = $row['resolved_activity'] ?? $row['activity'];

        return [
            'id' => (int)$row['id'],
            'day' => $row['day'],
            'time' => $row['time'],
            'activity' => $label,
            'level' => $row['level'],
            'activityId' => $aid !== null && $aid !== '' ? (string)$aid : null,
            'activityEnabled' => $enabled === null ? null : (bool)(int)$enabled,
        ];
    }
}
