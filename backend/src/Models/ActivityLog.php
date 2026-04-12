<?php

declare(strict_types=1);

namespace AFBoxing\Models;

use PDO;

class ActivityLog
{
    public function __construct(private PDO $pdo)
    {
    }

    public function all(int $limit = 1000, int $offset = 0): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM activity_log 
             ORDER BY created_at DESC 
             LIMIT :limit OFFSET :offset'
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function findByEntity(string $entity, int $limit = 100): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM activity_log 
             WHERE entity = :entity 
             ORDER BY created_at DESC 
             LIMIT :limit'
        );
        $stmt->bindValue(':entity', $entity);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function findByUser(string $user, int $limit = 100): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM activity_log 
             WHERE user = :user 
             ORDER BY created_at DESC 
             LIMIT :limit'
        );
        $stmt->bindValue(':user', $user);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function findByDateRange(string $from, string $to, int $limit = 1000): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM activity_log 
             WHERE created_at >= :from AND created_at <= :to 
             ORDER BY created_at DESC 
             LIMIT :limit'
        );
        $stmt->bindValue(':from', $from);
        $stmt->bindValue(':to', $to);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function create(array $data): array
    {
        $metadataJson = isset($data['metadata']) ? json_encode($data['metadata'], JSON_UNESCAPED_UNICODE) : null;
        
        $stmt = $this->pdo->prepare(
            'INSERT INTO activity_log (action, entity, description, user, metadata)
             VALUES (:action, :entity, :description, :user, :metadata)'
        );
        
        $stmt->execute([
            'action' => $data['action'],
            'entity' => $data['entity'],
            'description' => $data['description'] ?? null,
            'user' => $data['user'],
            'metadata' => $metadataJson
        ]);

        $id = (int)$this->pdo->lastInsertId();
        return $this->find($id);
    }

    public function find(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM activity_log WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        
        if ($row && $row['metadata']) {
            $row['metadata'] = json_decode($row['metadata'], true);
        }
        
        return $row ?: null;
    }

    public function clear(): bool
    {
        $stmt = $this->pdo->query('DELETE FROM activity_log');
        return $stmt->execute();
    }

    public function count(): int
    {
        $stmt = $this->pdo->query('SELECT COUNT(*) as count FROM activity_log');
        $row = $stmt->fetch();
        return (int)($row['count'] ?? 0);
    }
}

