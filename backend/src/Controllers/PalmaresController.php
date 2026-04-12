<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

use AFBoxing\Models\Palmares;

class PalmaresController extends BaseController
{
    private Palmares $palmares;

    public function __construct()
    {
        $this->palmares = new Palmares(afboxing_db());
    }

    public function index(array $params): void
    {
        $items = $this->palmares->all();
        $this->json($items);
    }

    public function store(array $params): void
    {
        $data = $params['_body'] ?? [];
        $errors = $this->validateRequired($data, ['title', 'date', 'location', 'category', 'result', 'boxer', 'details']);
        
        // Validation date
        if (empty($errors['date']) && isset($data['date'])) {
            if (!$this->validateDate($data['date'])) {
                $errors['date'] = 'Format de date invalide (attendu: YYYY-MM-DD).';
            }
        }
        
        // Validation longueurs
        foreach (['title', 'location', 'category', 'result', 'boxer'] as $field) {
            if (empty($errors[$field]) && isset($data[$field])) {
                if (!$this->validateLength($data[$field], 2, 255)) {
                    $errors[$field] = "Le champ {$field} doit contenir entre 2 et 255 caractères.";
                }
            }
        }
        
        if (empty($errors['details']) && isset($data['details'])) {
            if (!$this->validateLength($data['details'], 10, 2000)) {
                $errors['details'] = 'Les détails doivent contenir entre 10 et 2000 caractères.';
            }
        }
        
        if ($errors) {
            $this->json(['errors' => $errors], 422);
            return;
        }

        // Sanitization
        $sanitized = [
            'title' => $this->sanitizeString($data['title'], 255),
            'date' => $data['date'],
            'location' => $this->sanitizeString($data['location'], 255),
            'category' => $this->sanitizeString($data['category'], 255),
            'result' => $this->sanitizeString($data['result'], 255),
            'boxer' => $this->sanitizeString($data['boxer'], 255),
            'details' => $this->sanitizeString($data['details'], 2000),
            'image' => isset($data['image']) ? $this->sanitizeString($data['image'], 500) : null,
        ];

        $item = $this->palmares->create($sanitized);
        $this->json($item, 201);
    }

    public function update(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $existing = $this->palmares->find($id);
        if (!$existing) {
            $this->json(['error' => 'Palmarès introuvable'], 404);
            return;
        }

        $data = $params['_body'] ?? [];
        $errors = $this->validateRequired($data, ['title', 'date', 'location', 'category', 'result', 'boxer', 'details']);
        
        // Validation date
        if (empty($errors['date']) && isset($data['date'])) {
            if (!$this->validateDate($data['date'])) {
                $errors['date'] = 'Format de date invalide (attendu: YYYY-MM-DD).';
            }
        }
        
        // Validation longueurs
        foreach (['title', 'location', 'category', 'result', 'boxer'] as $field) {
            if (empty($errors[$field]) && isset($data[$field])) {
                if (!$this->validateLength($data[$field], 2, 255)) {
                    $errors[$field] = "Le champ {$field} doit contenir entre 2 et 255 caractères.";
                }
            }
        }
        
        if (empty($errors['details']) && isset($data['details'])) {
            if (!$this->validateLength($data['details'], 10, 2000)) {
                $errors['details'] = 'Les détails doivent contenir entre 10 et 2000 caractères.';
            }
        }
        
        if ($errors) {
            $this->json(['errors' => $errors], 422);
            return;
        }

        // Sanitization
        $sanitized = [
            'title' => $this->sanitizeString($data['title'], 255),
            'date' => $data['date'],
            'location' => $this->sanitizeString($data['location'], 255),
            'category' => $this->sanitizeString($data['category'], 255),
            'result' => $this->sanitizeString($data['result'], 255),
            'boxer' => $this->sanitizeString($data['boxer'], 255),
            'details' => $this->sanitizeString($data['details'], 2000),
            'image' => isset($data['image']) ? $this->sanitizeString($data['image'], 500) : null,
        ];

        $item = $this->palmares->update($id, $sanitized);
        $this->json($item ?? []);
    }

    public function destroy(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $this->palmares->delete($id);
        $this->json(['message' => 'Palmarès supprimé.']);
    }
}


