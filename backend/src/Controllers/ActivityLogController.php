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
        $limit = isset($params['limit']) ? (int)$params['limit'] : 1000;
        $offset = isset($params['offset']) ? (int)$params['offset'] : 0;
        $entity = $params['entity'] ?? null;
        $user = $params['user'] ?? null;
        $from = $params['from'] ?? null;
        $to = $params['to'] ?? null;
        
        if ($entity) {
            $items = $this->log->findByEntity($entity, $limit);
        } elseif ($user) {
            $items = $this->log->findByUser($user, $limit);
        } elseif ($from && $to) {
            $items = $this->log->findByDateRange($from, $to, $limit);
        } else {
            $items = $this->log->all($limit, $offset);
        }
        
        $this->json($items);
    }

    public function store(array $params): void
    {
        $data = $params['_body'] ?? [];
        
        $required = ['action', 'entity', 'user'];
        $errors = $this->validateRequired($data, $required);
        
        if (!empty($errors)) {
            $this->json(['errors' => $errors], 422);
            return;
        }

        try {
            $item = $this->log->create($data);
            $this->json($item, 201);
        } catch (\Exception $e) {
            $this->json(['error' => 'Erreur lors de l\'enregistrement'], 500);
        }
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
}

