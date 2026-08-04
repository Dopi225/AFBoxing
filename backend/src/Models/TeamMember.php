<?php

declare(strict_types=1);

namespace AFBoxing\Models;

use AFBoxing\Core\SoftDelete;
use PDO;

class TeamMember
{
    public function __construct(private PDO $pdo)
    {
    }

    public function all(): array
    {
        $where = SoftDelete::notDeletedClause();
        $stmt = $this->pdo->query(
            "SELECT * FROM team_members WHERE {$where} ORDER BY category ASC, display_order ASC, full_name ASC"
        );
        return array_map([$this, 'formatTeamMember'], $stmt->fetchAll());
    }

    public function find(int $id): ?array
    {
        $where = SoftDelete::notDeletedClause();
        $stmt = $this->pdo->prepare("SELECT * FROM team_members WHERE id = :id AND {$where}");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ? $this->formatTeamMember($row) : null;
    }

    public function create(array $data): array
    {
        $category = $data['category'];
        $displayOrder = isset($data['displayOrder'])
            ? (int)$data['displayOrder']
            : $this->nextDisplayOrder($category);

        $stmt = $this->pdo->prepare(
            'INSERT INTO team_members
             (full_name, role_label, category, bio, photo, certifications, display_order, enabled)
             VALUES
             (:full_name, :role_label, :category, :bio, :photo, :certifications, :display_order, :enabled)'
        );
        $stmt->execute([
            'full_name' => $data['fullName'],
            'role_label' => $data['role'],
            'category' => $category,
            'bio' => $data['bio'] ?? null,
            'photo' => $data['photo'] ?? null,
            'certifications' => $data['certifications'] ?? null,
            'display_order' => $displayOrder,
            'enabled' => isset($data['enabled']) ? (int)(bool)$data['enabled'] : 1,
        ]);

        return $this->find((int)$this->pdo->lastInsertId()) ?? [];
    }

    public function update(int $id, array $data): ?array
    {
        $existing = $this->find($id);
        if (!$existing) {
            return null;
        }

        $stmt = $this->pdo->prepare(
            'UPDATE team_members SET
                full_name = :full_name,
                role_label = :role_label,
                category = :category,
                bio = :bio,
                photo = :photo,
                certifications = :certifications,
                display_order = :display_order,
                enabled = :enabled
             WHERE id = :id AND ' . SoftDelete::notDeletedClause()
        );
        $stmt->execute([
            'id' => $id,
            'full_name' => $data['fullName'] ?? $existing['fullName'],
            'role_label' => $data['role'] ?? $existing['role'],
            'category' => $data['category'] ?? $existing['category'],
            'bio' => array_key_exists('bio', $data) ? ($data['bio'] ?: null) : ($existing['bio'] ?? null),
            'photo' => array_key_exists('photo', $data) ? ($data['photo'] ?: null) : ($existing['photo'] ?? null),
            'certifications' => array_key_exists('certifications', $data)
                ? ($data['certifications'] ?: null)
                : ($existing['certifications'] ?? null),
            'display_order' => isset($data['displayOrder'])
                ? (int)$data['displayOrder']
                : (int)$existing['displayOrder'],
            'enabled' => isset($data['enabled'])
                ? (int)(bool)$data['enabled']
                : (int)(bool)$existing['enabled'],
        ]);

        return $this->find($id);
    }

    public function delete(int $id): bool
    {
        return SoftDelete::softDelete($this->pdo, 'team_members', 'id', $id);
    }

    public function trash(): array
    {
        $where = SoftDelete::inTrashClause();
        $stmt = $this->pdo->query(
            "SELECT * FROM team_members WHERE {$where} ORDER BY deleted_at DESC"
        );
        return array_map([$this, 'formatTeamMember'], $stmt->fetchAll());
    }

    public function restore(int $id): bool
    {
        return SoftDelete::restore($this->pdo, 'team_members', 'id', $id);
    }

    /**
     * Échange display_order avec le voisin dans la même catégorie.
     *
     * @return array{moved: array, swapped: ?array}|null null si impossible
     */
    public function move(int $id, string $direction): ?array
    {
        $current = $this->find($id);
        if (!$current) {
            return null;
        }

        $where = SoftDelete::notDeletedClause();
        $order = $direction === 'up' ? 'DESC' : 'ASC';
        $compare = $direction === 'up' ? '<' : '>';

        $stmt = $this->pdo->prepare(
            "SELECT * FROM team_members
             WHERE category = :category
               AND display_order {$compare} :display_order
               AND {$where}
             ORDER BY display_order {$order}, full_name ASC
             LIMIT 1"
        );
        $stmt->execute([
            'category' => $current['category'],
            'display_order' => $current['displayOrder'],
        ]);
        $neighbor = $stmt->fetch();
        if (!$neighbor) {
            return null;
        }

        $neighborOrder = (int)$neighbor['display_order'];
        $currentOrder = (int)$current['displayOrder'];

        $this->pdo->beginTransaction();
        try {
            $upd = $this->pdo->prepare(
                'UPDATE team_members SET display_order = :display_order WHERE id = :id'
            );
            $upd->execute(['display_order' => $neighborOrder, 'id' => $id]);
            $upd->execute(['display_order' => $currentOrder, 'id' => (int)$neighbor['id']]);
            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }

        return [
            'moved' => $this->find($id),
            'swapped' => $this->formatTeamMember($neighbor),
        ];
    }

    private function nextDisplayOrder(string $category): int
    {
        $where = SoftDelete::notDeletedClause();
        $stmt = $this->pdo->prepare(
            "SELECT COALESCE(MAX(display_order), -1) + 1 AS next_order
             FROM team_members
             WHERE category = :category AND {$where}"
        );
        $stmt->execute(['category' => $category]);
        $row = $stmt->fetch();
        return (int)($row['next_order'] ?? 0);
    }

    private function formatTeamMember(array $row): array
    {
        return [
            'id' => (int)$row['id'],
            'fullName' => $row['full_name'],
            'role' => $row['role_label'],
            'category' => $row['category'],
            'bio' => $row['bio'] ?? null,
            'photo' => $row['photo'] ?? null,
            'certifications' => $row['certifications'] ?? null,
            'displayOrder' => (int)$row['display_order'],
            'enabled' => (bool)$row['enabled'],
            'createdAt' => $row['created_at'] ?? null,
            'updatedAt' => $row['updated_at'] ?? null,
            'deletedAt' => $row['deleted_at'] ?? null,
        ];
    }
}
