<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

use AFBoxing\Models\Gallery;

class GalleryController extends BaseController
{
    private Gallery $gallery;

    public function __construct()
    {
        $this->gallery = new Gallery(afboxing_db());
    }

    public function index(array $params): void
    {
        $items = $this->gallery->all();
        $this->json($items);
    }

    public function store(array $params): void
    {
        $data = $params['_body'] ?? [];
        $errors = $this->validateRequired($data, ['title', 'image']);
        
        // Validation longueurs
        if (empty($errors['title']) && isset($data['title'])) {
            if (!$this->validateLength($data['title'], 3, 255)) {
                $errors['title'] = 'Le titre doit contenir entre 3 et 255 caractères.';
            }
        }
        
        $imagePath = $data['image'] ?? $data['src'] ?? '';
        if (empty($errors['image']) && $imagePath) {
            if (!$this->validateLength($imagePath, 1, 500)) {
                $errors['image'] = 'Le chemin de l\'image est invalide.';
            }
        }
        
        if (isset($data['description']) && $data['description'] !== '') {
            if (!$this->validateLength($data['description'], 0, 1000)) {
                $errors['description'] = 'La description ne peut pas dépasser 1000 caractères.';
            }
        }
        
        if ($errors) {
            $this->json(['errors' => $errors], 422);
            return;
        }

        // Sanitization
        $sanitized = [
            'title' => $this->sanitizeString($data['title'], 255),
            'image' => $this->sanitizeString($imagePath, 500),
            'description' => isset($data['description']) ? $this->sanitizeString($data['description'], 1000) : null,
            'category' => isset($data['category']) ? $this->sanitizeString($data['category'], 100) : null,
        ];

        $item = $this->gallery->create($sanitized);
        $this->json($item, 201);
    }

    public function update(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $data = $params['_body'] ?? [];
        
        $existing = $this->gallery->find($id);
        if (!$existing) {
            $this->json(['error' => 'Image introuvable'], 404);
            return;
        }

        $errors = $this->validateRequired($data, ['title']);
        
        // Validation longueurs
        if (empty($errors['title']) && isset($data['title'])) {
            if (!$this->validateLength($data['title'], 3, 255)) {
                $errors['title'] = 'Le titre doit contenir entre 3 et 255 caractères.';
            }
        }
        
        $imagePath = $data['image'] ?? $data['src'] ?? $existing['image'] ?? '';
        if ($imagePath && !$this->validateLength($imagePath, 1, 500)) {
            $errors['image'] = 'Le chemin de l\'image est invalide.';
        }
        
        if (isset($data['description']) && $data['description'] !== '') {
            if (!$this->validateLength($data['description'], 0, 1000)) {
                $errors['description'] = 'La description ne peut pas dépasser 1000 caractères.';
            }
        }
        
        if (!empty($errors)) {
            $this->json(['errors' => $errors], 422);
            return;
        }

        // Sanitization
        $sanitized = [
            'title' => $this->sanitizeString($data['title'], 255),
            'image' => $this->sanitizeString($imagePath, 500),
            'description' => isset($data['description']) ? $this->sanitizeString($data['description'], 1000) : null,
            'category' => isset($data['category']) ? $this->sanitizeString($data['category'], 100) : null,
        ];

        $item = $this->gallery->update($id, $sanitized);
        if ($item) {
            $this->json($item);
        } else {
            $this->json(['error' => 'Erreur lors de la modification'], 500);
        }
    }

    public function destroy(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        
        if (!$this->gallery->find($id)) {
            $this->json(['error' => 'Image introuvable'], 404);
            return;
        }
        
        if ($this->gallery->delete($id)) {
            $this->json(['message' => 'Image supprimée avec succès']);
        } else {
            $this->json(['error' => 'Erreur lors de la suppression'], 500);
        }
    }
}


