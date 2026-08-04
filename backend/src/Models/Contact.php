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
        $rows = $stmt->fetchAll();
        return array_map([$this, 'formatContact'], $rows);
    }

    public function find(int $id): ?array
    {
        $where = SoftDelete::notDeletedClause();
        $stmt = $this->pdo->prepare("SELECT * FROM contacts WHERE id = :id AND {$where}");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ? $this->formatContact($row) : null;
    }

    public function create(array $data): array
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO contacts (name, email, message, is_read, is_replied, created_at)
             VALUES (:name, :email, :message, 0, 0, NOW())'
        );
        $stmt->execute([
            'name' => $data['name'],
            'email' => $data['email'],
            'message' => $data['message'],
        ]);

        $id = (int)$this->pdo->lastInsertId();
        return $this->find($id) ?? [];
    }

    public function markAsRead(int $id): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE contacts SET is_read = 1 WHERE id = :id AND ' . SoftDelete::notDeletedClause()
        );
        return $stmt->execute(['id' => $id]);
    }

    /**
     * Enregistre une réponse après envoi email réussi, et marque le message lu + répondu.
     *
     * @return array{reply: array, contact: array}
     */
    public function addReply(
        int $contactId,
        string $body,
        ?int $userId,
        string $sentByName
    ): array {
        $stmt = $this->pdo->prepare(
            'INSERT INTO contact_replies (contact_id, body, sent_by_user_id, sent_by_name)
             VALUES (:contact_id, :body, :user_id, :sent_by_name)'
        );
        $stmt->execute([
            'contact_id' => $contactId,
            'body' => $body,
            'user_id' => $userId,
            'sent_by_name' => $sentByName,
        ]);
        $replyId = (int)$this->pdo->lastInsertId();

        $upd = $this->pdo->prepare(
            'UPDATE contacts SET is_read = 1, is_replied = 1
             WHERE id = :id AND ' . SoftDelete::notDeletedClause()
        );
        $upd->execute(['id' => $contactId]);

        return [
            'reply' => $this->findReply($replyId),
            'contact' => $this->find($contactId) ?? [],
        ];
    }

    public function delete(int $id): bool
    {
        return SoftDelete::softDelete($this->pdo, 'contacts', 'id', $id);
    }

    public function trash(): array
    {
        $where = SoftDelete::inTrashClause();
        $stmt = $this->pdo->query("SELECT * FROM contacts WHERE {$where} ORDER BY deleted_at DESC");
        return array_map([$this, 'formatContact'], $stmt->fetchAll());
    }

    public function restore(int $id): bool
    {
        return SoftDelete::restore($this->pdo, 'contacts', 'id', $id);
    }

    private function findReply(int $id): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM contact_replies WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ? $this->formatReply($row) : [];
    }

    /**
     * @return list<array>
     */
    private function repliesForContact(int $contactId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM contact_replies WHERE contact_id = :id ORDER BY created_at ASC, id ASC'
        );
        $stmt->execute(['id' => $contactId]);
        return array_map([$this, 'formatReply'], $stmt->fetchAll());
    }

    private function formatContact(array $row): array
    {
        $id = (int)$row['id'];
        return [
            'id' => $id,
            'name' => $row['name'],
            'email' => $row['email'],
            'message' => $row['message'],
            'is_read' => (bool)($row['is_read'] ?? 0),
            'is_replied' => (bool)($row['is_replied'] ?? 0),
            'created_at' => $row['created_at'] ?? null,
            'deleted_at' => $row['deleted_at'] ?? null,
            'replies' => $this->repliesForContact($id),
        ];
    }

    private function formatReply(array $row): array
    {
        return [
            'id' => (int)$row['id'],
            'contactId' => (int)$row['contact_id'],
            'body' => $row['body'],
            'sentByUserId' => isset($row['sent_by_user_id']) ? (int)$row['sent_by_user_id'] : null,
            'sentByName' => $row['sent_by_name'],
            'createdAt' => $row['created_at'] ?? null,
        ];
    }
}
