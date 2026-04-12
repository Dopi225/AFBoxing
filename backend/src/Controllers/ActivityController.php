<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

use AFBoxing\Models\Activity;

class ActivityController extends BaseController
{
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
            $this->json($item, 201);
        } catch (\Exception $e) {
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
        
        if (!empty($errors)) {
            $this->json(['errors' => $errors], 422);
            return;
        }

        try {
            $item = $this->activity->update($id, $data);
            $this->json($item);
        } catch (\Exception $e) {
            error_log('Activity update error: ' . $e->getMessage());
            $this->json(['error' => 'Erreur lors de la modification de l\'activité: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(array $params): void
    {
        $id = $params['id'] ?? '';
        
        if (!$this->activity->find($id)) {
            $this->json(['error' => 'Activité introuvable'], 404);
            return;
        }

        if ($this->activity->delete($id)) {
            $this->json(['message' => 'Activité supprimée avec succès']);
        } else {
            $this->json(['error' => 'Erreur lors de la suppression'], 500);
        }
    }
}

