<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

use AFBoxing\Models\Activity;

class ActivityController extends BaseController
{
    use TrashActions;
    use LogsActivity;

    private Activity $activity;

    public function __construct()
    {
        $this->activity = new Activity(afboxing_db());
    }

    public function index(array $params): void
    {
        $items = $this->activity->all();
        $this->json($items);
    }

    public function show(array $params): void
    {
        $id = $params['id'] ?? '';
        $item = $this->activity->find($id);
        
        if (!$item) {
            $this->json(['error' => 'Activité introuvable'], 404);
            return;
        }
        
        $this->json($item);
    }

    public function store(array $params): void
    {
        $data = $params['_body'] ?? [];
        $errors = $this->validateRequired($data, ['id', 'title', 'subtitle']);
        
        if (!empty($errors)) {
            $this->json(['errors' => $errors], 422);
            return;
        }

        // Validation supplémentaire
        if (empty($errors['id']) && isset($data['id'])) {
            if (!$this->validateLength($data['id'], 1, 100)) {
                $errors['id'] = 'L\'ID doit contenir entre 1 et 100 caractères.';
            }
        }
        
        if (empty($errors['title']) && isset($data['title'])) {
            if (!$this->validateLength($data['title'], 1, 255)) {
                $errors['title'] = 'Le titre doit contenir entre 1 et 255 caractères.';
            }
        }
        
        if (empty($errors['subtitle']) && isset($data['subtitle'])) {
            if (!$this->validateLength($data['subtitle'], 1, 10000)) {
                $errors['subtitle'] = 'La description est requise.';
            }
        }
        
        if (isset($data['kind']) && !in_array($data['kind'], ['boxing', 'social'])) {
            $errors['kind'] = 'Le type doit être "boxing" ou "social".';
        }
        
        if (!empty($errors)) {
            $this->json(['errors' => $errors], 422);
            return;
        }

        try {
            $item = $this->activity->create($data);
            $this->logActivity($params, 'create', 'activity', 'Activité « ' . ($data['title'] ?? $data['id'] ?? '') . ' » créée');
            $this->json($item, 201);
        } catch (\PDOException $e) {
            if ((int)$e->getCode() === 23000) {
                $this->json(['errors' => ['id' => 'Cet identifiant existe déjà (éventuellement en corbeille restaurable).']], 422);
                return;
            }
            error_log('Activity create error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur lors de la création de l\'activité'], 500);
        } catch (\Exception $e) {
            error_log('Activity create error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur lors de la création de l\'activité'], 500);
        }
    }

    public function update(array $params): void
    {
        $id = $params['id'] ?? '';
        $data = $params['_body'] ?? [];
        
        $existing = $this->activity->find($id);
        if (!$existing) {
            $this->json(['error' => 'Activité introuvable'], 404);
            return;
        }

        $errors = $this->validateRequired($data, ['title', 'subtitle']);

        if (isset($data['kind']) && !in_array($data['kind'], ['boxing', 'social'], true)) {
            $errors['kind'] = 'Le type doit être "boxing" ou "social".';
        }
        if (isset($data['title']) && !$this->validateLength((string)$data['title'], 1, 255)) {
            $errors['title'] = 'Le titre doit contenir entre 1 et 255 caractères.';
        }
        if (isset($data['subtitle']) && !$this->validateLength((string)$data['subtitle'], 1, 10000)) {
            $errors['subtitle'] = 'Le sous-titre est trop long.';
        }
        
        if (!empty($errors)) {
            $this->json(['errors' => $errors], 422);
            return;
        }

        try {
            $item = $this->activity->update($id, $data);
            $this->logActivity($params, 'update', 'activity', 'Activité « ' . ($data['title'] ?? $id) . ' » modifiée');
            $this->json($item);
        } catch (\Exception $e) {
            error_log('Activity update error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur lors de la modification de l\'activité'], 500);
        }
    }

    public function destroy(array $params): void
    {
        $id = $params['id'] ?? '';
        $existing = $this->activity->find($id);
        
        if (!$existing) {
            $this->json(['error' => 'Activité introuvable'], 404);
            return;
        }

        if ($this->activity->delete($id)) {
            // Détache les créneaux liés (évite références orphelines)
            try {
                (new \AFBoxing\Models\Schedule(afboxing_db()))->clearActivityId((string)$id);
            } catch (\Throwable $e) {
                error_log('[afboxing] clear schedule activity_id: ' . $e->getMessage());
            }
            try {
                (new \AFBoxing\Models\Pricing(afboxing_db()))->clearActivityId((string)$id);
            } catch (\Throwable $e) {
                error_log('[afboxing] clear pricing activity_id: ' . $e->getMessage());
            }
            $this->logActivity($params, 'delete', 'activity', 'Activité déplacée en corbeille : ' . ($existing['title'] ?? $id));
            $this->json(['message' => 'Activité déplacée en corbeille (30 jours).']);
        } else {
            $this->json(['error' => 'Erreur lors de la suppression'], 500);
        }
    }

    public function trash(array $params): void
    {
        $this->trashList($this->activity);
    }

    public function restore(array $params): void
    {
        $id = $params['id'] ?? '';
        if (!$this->activity->restore($id)) {
            $this->jsonError('NOT_FOUND', 'Élément introuvable dans la corbeille.', 404);
            return;
        }
        $this->logActivity($params, 'restore', 'activity', 'Activité restaurée : ' . $id);
        $original = preg_replace('/__trash_\d+$/', '', (string)$id) ?: (string)$id;
        $item = $this->activity->find($original) ?? $this->activity->find((string)$id);
        $this->json(['message' => 'Élément restauré.', 'item' => $item]);
    }
}

