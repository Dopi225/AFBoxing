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

    /**
     * Recherche combinée (entity, action, user, plage de dates).
     *
     * @param array{entity?:?string,user?:?string,action?:?string,from?:?string,to?:?string,limit?:int,offset?:int} $filters
     * @return list<array<string,mixed>>
     */
    public function search(array $filters): array
    {
        $where = ['1=1'];
        $bind = [];

        if (!empty($filters['entity'])) {
            $where[] = 'entity = :entity';
            $bind['entity'] = $filters['entity'];
        }
        if (!empty($filters['user'])) {
            $where[] = 'user = :user';
            $bind['user'] = $filters['user'];
        }
        if (!empty($filters['action'])) {
            $where[] = 'action = :action';
            $bind['action'] = $filters['action'];
        }
        if (!empty($filters['from'])) {
            $where[] = 'created_at >= :from';
            $bind['from'] = $filters['from'] . (strlen($filters['from']) === 10 ? ' 00:00:00' : '');
        }
        if (!empty($filters['to'])) {
            $where[] = 'created_at <= :to';
            $bind['to'] = $filters['to'] . (strlen($filters['to']) === 10 ? ' 23:59:59' : '');
        }

        $limit = isset($filters['limit']) ? (int)$filters['limit'] : 1000;
        $offset = isset($filters['offset']) ? (int)$filters['offset'] : 0;

        $sql = 'SELECT * FROM activity_log WHERE ' . implode(' AND ', $where)
            . ' ORDER BY created_at DESC LIMIT :limit OFFSET :offset';
        $stmt = $this->pdo->prepare($sql);
        foreach ($bind as $k => $v) {
            $stmt->bindValue(':' . $k, $v);
        }
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

