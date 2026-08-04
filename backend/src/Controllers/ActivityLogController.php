<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

use AFBoxing\Models\ActivityLog;

class ActivityLogController extends BaseController
{
    private ActivityLog $log;

    public function __construct()
    {
        $this->log = new ActivityLog(afboxing_db());
    }

    public function index(array $params): void
    {
        $limit = isset($params['limit']) ? min(2000, max(1, (int)$params['limit'])) : 1000;
        $offset = isset($params['offset']) ? max(0, (int)$params['offset']) : 0;
        $entity = isset($params['entity']) && $params['entity'] !== '' ? (string)$params['entity'] : null;
        $user = isset($params['user']) && $params['user'] !== '' ? (string)$params['user'] : null;
        $action = isset($params['action']) && $params['action'] !== '' ? (string)$params['action'] : null;
        $from = isset($params['from']) && $params['from'] !== '' ? (string)$params['from'] : null;
        $to = isset($params['to']) && $params['to'] !== '' ? (string)$params['to'] : null;

        $items = $this->log->search([
            'entity' => $entity,
            'user' => $user,
            'action' => $action,
            'from' => $from,
            'to' => $to,
            'limit' => $limit,
            'offset' => $offset,
        ]);

        $this->json(array_map([$this, 'formatLog'], $items));
    }

    public function store(array $params): void
    {
        // Les logs métier sont écrits uniquement côté serveur (LogsActivity).
        // On refuse les POST clients pour éviter des entrées falsifiées.
        $this->jsonError(
            'METHOD_NOT_ALLOWED',
            'L\'historique est écrit automatiquement par le serveur. Cet endpoint n\'accepte plus d\'écriture client.',
            405
        );
    }

    public function clear(array $params): void
    {
        if ($this->log->clear()) {
            $this->json(['message' => 'Historique effacé avec succès']);
        } else {
            $this->json(['error' => 'Erreur lors de l\'effacement'], 500);
        }
    }

    public function count(array $params): void
    {
        $count = $this->log->count();
        $this->json(['count' => $count]);
    }

    /**
     * @param array<string,mixed> $row
     * @return array<string,mixed>
     */
    private function formatLog(array $row): array
    {
        if (isset($row['metadata']) && is_string($row['metadata'])) {
            $row['metadata'] = json_decode($row['metadata'], true);
        }
        // Alias attendu par le frontend
        if (!isset($row['timestamp']) && isset($row['created_at'])) {
            $row['timestamp'] = $row['created_at'];
        }
        return $row;
    }
}
