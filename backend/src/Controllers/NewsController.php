<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

use AFBoxing\Models\News;

class NewsController extends BaseController
{
    private News $news;

    public function __construct()
    {
        $this->news = new News(afboxing_db());
    }

    public function index(array $params): void
    {
        $items = $this->news->all();
        $this->json($items);
    }

    public function show(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $item = $this->news->find($id);
        if (!$item) {
            $this->json(['error' => 'Actualité introuvable'], 404);
            return;
        }
        $this->json($item);
    }

    public function store(array $params): void
    {
        $data = $params['_body'] ?? [];
        $errors = $this->validateRequired($data, ['title', 'date', 'summary', 'description']);
        
        // Validation date
        if (empty($errors['date']) && isset($data['date'])) {
            if (!$this->validateDate($data['date'])) {
                $errors['date'] = 'Format de date invalide (attendu: YYYY-MM-DD).';
            }
        }
        
        // Validation longueurs
        if (empty($errors['title']) && isset($data['title'])) {
            if (!$this->validateLength($data['title'], 3, 255)) {
                $errors['title'] = 'Le titre doit contenir entre 3 et 255 caractères.';
            }
        }
        
        if (empty($errors['summary']) && isset($data['summary'])) {
            if (!$this->validateLength($data['summary'], 10, 500)) {
                $errors['summary'] = 'Le résumé doit contenir entre 10 et 500 caractères.';
            }
        }
        
        if (empty($errors['description']) && isset($data['description'])) {
            if (!$this->validateLength($data['description'], 20, 10000)) {
                $errors['description'] = 'La description doit contenir entre 20 et 10000 caractères.';
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
            'summary' => $this->sanitizeString($data['summary'], 500),
            'description' => $this->sanitizeString($data['description'], 10000),
            'image' => isset($data['image']) ? $this->sanitizeString($data['image'], 500) : null,
        ];

        $item = $this->news->create($sanitized);
        $this->json($item, 201);
    }

    public function update(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $existing = $this->news->find($id);
        if (!$existing) {
            $this->json(['error' => 'Actualité introuvable'], 404);
            return;
        }

        $data = $params['_body'] ?? [];
        $errors = $this->validateRequired($data, ['title', 'date', 'summary', 'description']);
        
        // Validation date
        if (empty($errors['date']) && isset($data['date'])) {
            if (!$this->validateDate($data['date'])) {
                $errors['date'] = 'Format de date invalide (attendu: YYYY-MM-DD).';
            }
        }
        
        // Validation longueurs
        if (empty($errors['title']) && isset($data['title'])) {
            if (!$this->validateLength($data['title'], 3, 255)) {
                $errors['title'] = 'Le titre doit contenir entre 3 et 255 caractères.';
            }
        }
        
        if (empty($errors['summary']) && isset($data['summary'])) {
            if (!$this->validateLength($data['summary'], 10, 500)) {
                $errors['summary'] = 'Le résumé doit contenir entre 10 et 500 caractères.';
            }
        }
        
        if (empty($errors['description']) && isset($data['description'])) {
            if (!$this->validateLength($data['description'], 20, 10000)) {
                $errors['description'] = 'La description doit contenir entre 20 et 10000 caractères.';
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
            'summary' => $this->sanitizeString($data['summary'], 500),
            'description' => $this->sanitizeString($data['description'], 10000),
            'image' => isset($data['image']) ? $this->sanitizeString($data['image'], 500) : null,
        ];

        $item = $this->news->update($id, $sanitized);
        $this->json($item ?? []);
    }

    public function destroy(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $existing = $this->news->find($id);
        if (!$existing) {
            $this->json(['error' => 'Actualité introuvable'], 404);
            return;
        }

        $this->news->delete($id);
        $this->json(['message' => 'Actualité supprimée.']);
    }
}


