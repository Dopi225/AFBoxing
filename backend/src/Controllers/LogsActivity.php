<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

use AFBoxing\Models\ActivityLog;

/**
 * Journalisation serveur des actions CRUD (utilisateur tiré du JWT).
 */
trait LogsActivity
{
    /**
     * @param array<string,mixed> $params Route params (doit contenir authUser si disponible)
     * @param array<string,mixed>|null $metadata
     */
    protected function logActivity(
        array $params,
        string $action,
        string $entity,
        string $description,
        ?array $metadata = null,
        ?string $fallbackUser = null
    ): void {
        try {
            $auth = $params['authUser'] ?? [];
            $user = (string)($auth['username'] ?? $fallbackUser ?? 'Système');
            if ($user === '') {
                $user = 'Système';
            }

            $log = new ActivityLog(afboxing_db());
            $log->create([
                'action' => $action,
                'entity' => $entity,
                'description' => $description,
                'user' => $user,
                'metadata' => $metadata,
            ]);
        } catch (\Throwable $e) {
            error_log('[afboxing] activity log failed: ' . $e->getMessage());
        }
    }
}
