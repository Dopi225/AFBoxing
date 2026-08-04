<?php

declare(strict_types=1);

namespace AFBoxing\Models;

use AFBoxing\Core\SoftDelete;
use PDO;

class Contact
{
    public function __construct(private PDO $pdo)
    {
    }

    public function all(): array
    {
        $where = SoftDelete::notDeletedClause();
        $stmt = $this->pdo->query("SELECT * FROM contacts WHERE {$where} ORDER BY created_at DESC");
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
        $stmt = $this->pdo->prepare(
            'UPDATE contacts SET is_read = 1 WHERE id = :id AND ' . SoftDelete::notDeletedClause()
        );
        return $stmt->execute(['id' => $id]);
    }

    public function delete(int $id): bool
    {
        return SoftDelete::softDelete($this->pdo, 'contacts', 'id', $id);
    }

    public function trash(): array
    {
        $where = SoftDelete::inTrashClause();
        $stmt = $this->pdo->query("SELECT * FROM contacts WHERE {$where} ORDER BY deleted_at DESC");
        return $stmt->fetchAll();
    }

    public function restore(int $id): bool
    {
        return SoftDelete::restore($this->pdo, 'contacts', 'id', $id);
    }
}
