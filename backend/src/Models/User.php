<?php

declare(strict_types=1);

namespace AFBoxing\Models;

use PDO;

class User
{
    public function __construct(private PDO $pdo)
    {
    }

    public function findByUsername(string $username): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE username = :username LIMIT 1');
        $stmt->execute(['username' => $username]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return is_array($row) ? $row : null;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function allSafe(): array
    {
        $stmt = $this->pdo->query(
            'SELECT id, username, role, created_at FROM users ORDER BY username ASC'
        );
        /** @var list<array<string, mixed>> */
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findByIdSafe(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, username, role, created_at FROM users WHERE id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function usernameExists(string $username, ?int $exceptId): bool
    {
        if ($exceptId !== null) {
            $stmt = $this->pdo->prepare(
                'SELECT 1 FROM users WHERE username = :username AND id != :id LIMIT 1'
            );
            $stmt->execute(['username' => $username, 'id' => $exceptId]);
        } else {
            $stmt = $this->pdo->prepare('SELECT 1 FROM users WHERE username = :username LIMIT 1');
            $stmt->execute(['username' => $username]);
        }
        return (bool) $stmt->fetchColumn();
    }

    public function countByRole(string $role): int
    {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM users WHERE role = :role');
        $stmt->execute(['role' => $role]);
        return (int) $stmt->fetchColumn();
    }

    public function create(string $username, string $passwordHash, string $role): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO users (username, password, role) VALUES (:username, :password, :role)'
        );
        $stmt->execute([
            'username' => $username,
            'password' => $passwordHash,
            'role' => $role,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, string $username, string $role, ?string $passwordHash): void
    {
        if ($passwordHash !== null) {
            $stmt = $this->pdo->prepare(
                'UPDATE users SET username = :username, role = :role, password = :password WHERE id = :id'
            );
            $stmt->execute([
                'username' => $username,
                'role' => $role,
                'password' => $passwordHash,
                'id' => $id,
            ]);
            return;
        }

        $stmt = $this->pdo->prepare(
            'UPDATE users SET username = :username, role = :role WHERE id = :id'
        );
        $stmt->execute([
            'username' => $username,
            'role' => $role,
            'id' => $id,
        ]);
    }

    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM users WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
}


