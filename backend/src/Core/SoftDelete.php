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
        $stmt = $pdo->prepare("UPDATE {$table} SET deleted_at = NOW() WHERE {$idColumn} = :id AND deleted_at IS NULL");
        return $stmt->execute(['id' => $id]);
    }

    public static function restore(PDO $pdo, string $table, string $idColumn, int|string $id): bool
    {
        $stmt = $pdo->prepare(
            "UPDATE {$table} SET deleted_at = NULL WHERE {$idColumn} = :id AND " . self::inTrashClause()
        );
        return $stmt->execute(['id' => $id]);
    }

    public static function purgeExpired(PDO $pdo, string $table): int
    {
        $days = self::RETENTION_DAYS;
        $stmt = $pdo->prepare(
            "DELETE FROM {$table} WHERE deleted_at IS NOT NULL AND deleted_at < DATE_SUB(NOW(), INTERVAL {$days} DAY)"
        );
        $stmt->execute();
        return $stmt->rowCount();
    }
}
