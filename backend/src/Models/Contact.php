<?php

declare(strict_types=1);

namespace AFBoxing\Models;

use PDO;

class Contact
{
    public function __construct(private PDO $pdo)
    {
    }

    public function all(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM contacts ORDER BY created_at DESC');
        return $stmt->fetchAll();
    }

    public function create(array $data): array
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO contacts (name, email, message, is_read, created_at)
             VALUES (:name, :email, :message, 0, NOW())'
        );
        $stmt->execute([
            'name' => $data['name'],
            'email' => $data['email'],
            'message' => $data['message'],
        ]);

        $id = (int)$this->pdo->lastInsertId();
        $stmt = $this->pdo->prepare('SELECT * FROM contacts WHERE id = :id');
        $stmt->execute(['id' => $id]);
        return $stmt->fetch() ?: [];
    }

    public function markAsRead(int $id): bool
    {
        $stmt = $this->pdo->prepare('UPDATE contacts SET is_read = 1 WHERE id = :id');
        return $stmt->execute(['id' => $id]);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM contacts WHERE id = :id');
        return $stmt->execute(['id' => $id]);
    }
}


