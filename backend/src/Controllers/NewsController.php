<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

use AFBoxing\Models\News;

class NewsController extends BaseController
{
    use TrashActions;
    use LogsActivity;

    private News $news;

    public function __construct()
    {
        $this->news = new News(afboxing_db());
    }

    public function index(array $params): void
    {
        $page = isset($_GET['page']) ? max(1, (int) $_GET['page']) : 1;
        $perPage = isset($_GET['per_page']) ? min(500, max(1, (int) $_GET['per_page'])) : 500;
        $total = $this->news->countAll();
        $items = $this->news->paginate($page, $perPage);
        $totalPages = $perPage > 0 ? (int) ceil($total / $perPage) : 0;

        $this->json([
            'data' => $items,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => $totalPages,
            ],
        ]);
    }

    public function show(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $item = $this->news->find($id);
        if (!$item) {
            $this->jsonError('NOT_FOUND', 'Actualité introuvable', 404);
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

        // Sanitization (texte affiché en React échappé ; strip_tags en défense)
        $sanitized = [
            'title' => $this->sanitizePlainText($data['title'], 255),
            'date' => $data['date'],
            'summary' => $this->sanitizePlainText($data['summary'], 500),
            'description' => $this->sanitizePlainText($data['description'], 10000),
            'image' => isset($data['image']) ? $this->sanitizeString($data['image'], 500) : null,
        ];

        $item = $this->news->create($sanitized);
        $this->logActivity($params, 'create', 'news', 'Actualité « ' . $sanitized['title'] . ' » créée');
        $this->json($item, 201);
    }

    public function update(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $existing = $this->news->find($id);
        if (!$existing) {
            $this->jsonError('NOT_FOUND', 'Actualité introuvable', 404);
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
            'title' => $this->sanitizePlainText($data['title'], 255),
            'date' => $data['date'],
            'summary' => $this->sanitizePlainText($data['summary'], 500),
            'description' => $this->sanitizePlainText($data['description'], 10000),
            'image' => isset($data['image']) ? $this->sanitizeString($data['image'], 500) : null,
        ];

        $item = $this->news->update($id, $sanitized);
        $this->logActivity($params, 'update', 'news', 'Actualité « ' . $sanitized['title'] . ' » modifiée');
        $this->json($item ?? []);
    }

    public function destroy(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $existing = $this->news->find($id);
        if (!$existing) {
            $this->jsonError('NOT_FOUND', 'Actualité introuvable', 404);
            return;
        }

        $title = (string)($existing['title'] ?? '');
        $this->news->delete($id);
        $this->logActivity($params, 'delete', 'news', 'Actualité déplacée en corbeille : ' . $title);
        $this->json(['message' => 'Actualité déplacée en corbeille (30 jours).']);
    }

    public function trash(array $params): void
    {
        $this->trashList($this->news);
    }

    public function restore(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        if (!$this->news->restore($id)) {
            $this->jsonError('NOT_FOUND', 'Élément introuvable dans la corbeille.', 404);
            return;
        }
        $this->logActivity($params, 'restore', 'news', 'Actualité restaurée (id ' . $id . ')');
        $this->json(['message' => 'Élément restauré.', 'item' => $this->news->find($id)]);
    }
}


