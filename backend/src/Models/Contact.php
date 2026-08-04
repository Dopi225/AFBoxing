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
        if ($rows === []) {
            return [];
        }
        $ids = array_map(static fn(array $r): int => (int)$r['id'], $rows);
        $repliesByContact = $this->repliesForContacts($ids);
        return array_map(
            fn(array $row): array => $this->formatContact($row, $repliesByContact[(int)$row['id']] ?? []),
            $rows
        );
    }

    public function countAll(): int
    {
        $where = SoftDelete::notDeletedClause();
        $stmt = $this->pdo->query("SELECT COUNT(*) FROM contacts WHERE {$where}");
        return (int)$stmt->fetchColumn();
    }

    /**
     * @return list<array>
     */
    public function paginate(int $page, int $perPage): array
    {
        $page = max(1, $page);
        $perPage = max(1, min(200, $perPage));
        $offset = ($page - 1) * $perPage;
        $where = SoftDelete::notDeletedClause();
        $stmt = $this->pdo->prepare(
            "SELECT * FROM contacts WHERE {$where} ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
        );
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();
        if ($rows === []) {
            return [];
        }
        $ids = array_map(static fn(array $r): int => (int)$r['id'], $rows);
        $repliesByContact = $this->repliesForContacts($ids);
        return array_map(
            fn(array $row): array => $this->formatContact($row, $repliesByContact[(int)$row['id']] ?? []),
            $rows
        );
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

    public function findReplyByIdempotencyKey(string $key): ?array
    {
        if (!$this->hasReplyIdempotencyColumns()) {
            return null;
        }
        $stmt = $this->pdo->prepare(
            'SELECT * FROM contact_replies WHERE idempotency_key = :k LIMIT 1'
        );
        $stmt->execute(['k' => $key]);
        $row = $stmt->fetch();
        return $row ? $this->formatReply($row) : null;
    }

    /**
     * Crée une réponse en statut pending (avant envoi email).
     * Ne marque pas encore le contact comme « répondu ».
     *
     * @return array{reply: array, contact: array}
     */
    public function createPendingReply(
        int $contactId,
        string $body,
        ?int $userId,
        string $sentByName,
        ?string $idempotencyKey
    ): array {
        if (!$this->hasReplyIdempotencyColumns()) {
            // Fallback sans migration : pas de pending, l’appelant enverra le mail puis addReply
            return [
                'reply' => ['id' => 0, 'status' => 'legacy'],
                'contact' => $this->find($contactId) ?? [],
                'legacy' => true,
            ];
        }

        $stmt = $this->pdo->prepare(
            'INSERT INTO contact_replies (contact_id, body, sent_by_user_id, sent_by_name, status, idempotency_key)
             VALUES (:contact_id, :body, :user_id, :sent_by_name, \'pending\', :idempotency_key)'
        );
        $stmt->execute([
            'contact_id' => $contactId,
            'body' => $body,
            'user_id' => $userId,
            'sent_by_name' => $sentByName,
            'idempotency_key' => $idempotencyKey,
        ]);
        $replyId = (int)$this->pdo->lastInsertId();

        return [
            'reply' => $this->findReply($replyId),
            'contact' => $this->find($contactId) ?? [],
        ];
    }

    /**
     * Après envoi email réussi : marque la réponse « sent » et le contact lu + répondu.
     *
     * @return array{reply: array, contact: array}
     */
    public function finalizeReply(int $replyId, int $contactId): array
    {
        if ($replyId < 1 || !$this->hasReplyIdempotencyColumns()) {
            return [
                'reply' => [],
                'contact' => $this->find($contactId) ?? [],
            ];
        }

        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare(
                'UPDATE contact_replies SET status = \'sent\' WHERE id = :id AND status = \'pending\''
            );
            $stmt->execute(['id' => $replyId]);

            $upd = $this->pdo->prepare(
                'UPDATE contacts SET is_read = 1, is_replied = 1
                 WHERE id = :id AND ' . SoftDelete::notDeletedClause()
            );
            $upd->execute(['id' => $contactId]);

            $this->pdo->commit();
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }

        return [
            'reply' => $this->findReply($replyId),
            'contact' => $this->find($contactId) ?? [],
        ];
    }

    /** En cas d'échec d'envoi : marque failed (ou supprime si trop récent). */
    public function failReply(int $replyId): void
    {
        if ($replyId < 1 || !$this->hasReplyIdempotencyColumns()) {
            return;
        }
        $stmt = $this->pdo->prepare(
            'UPDATE contact_replies SET status = \'failed\' WHERE id = :id AND status = \'pending\''
        );
        $stmt->execute(['id' => $replyId]);
    }

    /** Libère les pending orphelins (crash entre pending et finalize) après $ttlSeconds. */
    public function expireStalePendingReplies(int $ttlSeconds = 120): int
    {
        if (!$this->hasReplyIdempotencyColumns()) {
            return 0;
        }
        $ttlSeconds = max(30, min(3600, $ttlSeconds));
        $stmt = $this->pdo->prepare(
            "UPDATE contact_replies SET status = 'failed'
             WHERE status = 'pending'
               AND created_at < DATE_SUB(NOW(), INTERVAL {$ttlSeconds} SECOND)"
        );
        $stmt->execute();
        return $stmt->rowCount();
    }

    private function hasReplyIdempotencyColumns(): bool
    {
        static $cached = null;
        if ($cached !== null) {
            return $cached;
        }
        try {
            $stmt = $this->pdo->query("SHOW COLUMNS FROM contact_replies LIKE 'idempotency_key'");
            $cached = (bool)$stmt->fetch();
        } catch (\Throwable) {
            $cached = false;
        }
        return $cached;
    }

    /**
     * Enregistre une réponse après envoi email réussi, et marque le message lu + répondu.
     * Conservé pour compatibilité ; préférer createPendingReply + finalizeReply.
     *
     * @return array{reply: array, contact: array}
     */
    public function addReply(
        int $contactId,
        string $body,
        ?int $userId,
        string $sentByName
    ): array {
        if ($this->hasReplyIdempotencyColumns()) {
            $stmt = $this->pdo->prepare(
                'INSERT INTO contact_replies (contact_id, body, sent_by_user_id, sent_by_name, status)
                 VALUES (:contact_id, :body, :user_id, :sent_by_name, \'sent\')'
            );
        } else {
            $stmt = $this->pdo->prepare(
                'INSERT INTO contact_replies (contact_id, body, sent_by_user_id, sent_by_name)
                 VALUES (:contact_id, :body, :user_id, :sent_by_name)'
            );
        }
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
     * @param list<int> $contactIds
     * @return array<int, list<array>>
     */
    private function repliesForContacts(array $contactIds): array
    {
        if ($contactIds === []) {
            return [];
        }
        $placeholders = implode(',', array_fill(0, count($contactIds), '?'));
        if ($this->hasReplyIdempotencyColumns()) {
            $sql = "SELECT * FROM contact_replies
                    WHERE contact_id IN ({$placeholders}) AND status IN ('sent', 'pending')
                    ORDER BY created_at ASC, id ASC";
        } else {
            $sql = "SELECT * FROM contact_replies
                    WHERE contact_id IN ({$placeholders})
                    ORDER BY created_at ASC, id ASC";
        }
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(array_values($contactIds));
        $byContact = [];
        foreach ($stmt->fetchAll() as $row) {
            $cid = (int)$row['contact_id'];
            $byContact[$cid] ??= [];
            $byContact[$cid][] = $this->formatReply($row);
        }
        return $byContact;
    }

    /**
     * @return list<array>
     */
    private function repliesForContact(int $contactId): array
    {
        return $this->repliesForContacts([$contactId])[$contactId] ?? [];
    }

    private function formatContact(array $row, ?array $replies = null): array
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
            'replies' => $replies ?? $this->repliesForContact($id),
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
            'status' => $row['status'] ?? 'sent',
            'idempotencyKey' => $row['idempotency_key'] ?? null,
            'createdAt' => $row['created_at'] ?? null,
        ];
    }
}
