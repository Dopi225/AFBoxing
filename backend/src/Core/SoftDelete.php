<?php

declare(strict_types=1);

namespace AFBoxing\Core;

use PDO;

/**
 * Helpers soft-delete (corbeille 30 jours).
 */
final class SoftDelete
{
    public const RETENTION_DAYS = 30;

    public static function notDeletedClause(string $alias = ''): string
    {
        $col = $alias !== '' ? "{$alias}.deleted_at" : 'deleted_at';
        return "({$col} IS NULL)";
    }

    public static function inTrashClause(string $alias = ''): string
    {
        $col = $alias !== '' ? "{$alias}.deleted_at" : 'deleted_at';
        $days = self::RETENTION_DAYS;
        return "({$col} IS NOT NULL AND {$col} >= DATE_SUB(NOW(), INTERVAL {$days} DAY))";
    }

    public static function softDelete(PDO $pdo, string $table, string $idColumn, int|string $id): bool
    {
        self::assertSafeIdentifier($table);
        self::assertSafeIdentifier($idColumn);
        $stmt = $pdo->prepare("UPDATE {$table} SET deleted_at = NOW() WHERE {$idColumn} = :id AND deleted_at IS NULL");
        $stmt->execute(['id' => $id]);
        return $stmt->rowCount() > 0;
    }

    public static function restore(PDO $pdo, string $table, string $idColumn, int|string $id): bool
    {
        self::assertSafeIdentifier($table);
        self::assertSafeIdentifier($idColumn);
        $stmt = $pdo->prepare(
            "UPDATE {$table} SET deleted_at = NULL WHERE {$idColumn} = :id AND " . self::inTrashClause()
        );
        $stmt->execute(['id' => $id]);
        return $stmt->rowCount() > 0;
    }

    public static function purgeExpired(PDO $pdo, string $table): int
    {
        self::assertSafeIdentifier($table);
        $days = self::RETENTION_DAYS;
        $stmt = $pdo->prepare(
            "DELETE FROM {$table} WHERE deleted_at IS NOT NULL AND deleted_at < DATE_SUB(NOW(), INTERVAL {$days} DAY)"
        );
        $stmt->execute();
        return $stmt->rowCount();
    }

    /** Refuse toute concaténation SQL hors identifiants sûrs (a-z0-9_). */
    private static function assertSafeIdentifier(string $name): void
    {
        if (!preg_match('/^[a-z][a-z0-9_]*$/i', $name)) {
            throw new \InvalidArgumentException('Identifiant SQL non autorisé.');
        }
    }

    /** Tables avec soft-delete (corbeille 30 jours) + colonnes image éventuelles. */
    public const TRASH_TABLES = [
        'news' => ['image'],
        'gallery' => ['image'],
        'palmares' => ['image'],
        'contacts' => [],
        'activities' => ['image'],
        'pricing' => [],
        'team_members' => ['photo'],
    ];

    /**
     * Purge toutes les tables corbeille (et fichiers upload locaux associés).
     *
     * @return array<string,int> table => lignes supprimées
     */
    public static function purgeAllExpired(PDO $pdo): array
    {
        $result = [];
        foreach (self::TRASH_TABLES as $table => $imageColumns) {
            try {
                if ($imageColumns !== []) {
                    self::deleteExpiredUploadFiles($pdo, $table, $imageColumns);
                }
                $result[$table] = self::purgeExpired($pdo, $table);
            } catch (\Throwable $e) {
                error_log('[afboxing] purgeExpired ' . $table . ': ' . $e->getMessage());
                $result[$table] = 0;
            }
        }
        return $result;
    }

    /**
     * @param list<string> $imageColumns
     */
    private static function deleteExpiredUploadFiles(PDO $pdo, string $table, array $imageColumns): void
    {
        self::assertSafeIdentifier($table);
        $days = self::RETENTION_DAYS;
        $safeCols = [];
        foreach ($imageColumns as $col) {
            self::assertSafeIdentifier($col);
            $safeCols[] = $col;
        }
        $cols = implode(', ', $safeCols);
        $stmt = $pdo->prepare(
            "SELECT {$cols} FROM {$table}
             WHERE deleted_at IS NOT NULL AND deleted_at < DATE_SUB(NOW(), INTERVAL {$days} DAY)"
        );
        $stmt->execute();
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            foreach ($imageColumns as $col) {
                if (!empty($row[$col])) {
                    UploadedFileCleanup::deleteIfLocal((string)$row[$col]);
                }
            }
        }
    }

    /**
     * Purge opportuniste (au plus une fois par heure), via fichier lock.
     *
     * @return array<string,int>|null null si pas encore l’heure
     */
    public static function maybePurgeAllExpired(PDO $pdo, string $lockDir): ?array
    {
        if (!is_dir($lockDir) && !@mkdir($lockDir, 0775, true) && !is_dir($lockDir)) {
            return null;
        }
        $lockFile = rtrim($lockDir, '/\\') . DIRECTORY_SEPARATOR . 'soft_delete_purge.lock';
        $now = time();
        $last = is_file($lockFile) ? (int)@file_get_contents($lockFile) : 0;
        if ($last > 0 && ($now - $last) < 3600) {
            return null;
        }
        @file_put_contents($lockFile, (string)$now);
        return self::purgeAllExpired($pdo);
    }
}
