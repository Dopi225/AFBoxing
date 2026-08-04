<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

use AFBoxing\Models\TeamMember;

class TeamMemberController extends BaseController
{
    use TrashActions;
    use LogsActivity;

    private const ALLOWED_CATEGORIES = ['coaches', 'board', 'volunteers'];

    private TeamMember $teamMembers;

    public function __construct()
    {
        $this->teamMembers = new TeamMember(afboxing_db());
    }

    public function index(array $params): void
    {
        $this->json($this->teamMembers->all());
    }

    public function show(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $item = $this->teamMembers->find($id);
        if (!$item) {
            $this->json(['error' => 'Membre introuvable'], 404);
            return;
        }
        $this->json($item);
    }

    public function store(array $params): void
    {
        $data = $params['_body'] ?? [];
        $errors = $this->validateTeamMember($data);
        if ($errors) {
            $this->json(['errors' => $errors], 422);
            return;
        }

        $item = $this->teamMembers->create($this->sanitizeTeamMember($data));
        $this->logActivity($params, 'create', 'team_member', 'Membre « ' . ($item['fullName'] ?? '') . ' » ajouté à l\'équipe');
        $this->json($item, 201);
    }

    public function update(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $existing = $this->teamMembers->find($id);
        if (!$existing) {
            $this->json(['error' => 'Membre introuvable'], 404);
            return;
        }

        $data = $params['_body'] ?? [];
        // Toggle enabled seul : accepter un body partiel
        $isPartialToggle = array_key_exists('enabled', $data)
            && !isset($data['fullName'])
            && !isset($data['role'])
            && !isset($data['category']);

        if ($isPartialToggle) {
            $merged = array_merge($existing, [
                'enabled' => (bool)$data['enabled'],
            ]);
            $item = $this->teamMembers->update($id, $merged);
            $label = $existing['fullName'] ?? '';
            $state = !empty($data['enabled']) ? 'affiché' : 'masqué';
            $this->logActivity($params, 'update', 'team_member', 'Membre « ' . $label . ' » ' . $state);
            $this->json($item ?? []);
            return;
        }

        $errors = $this->validateTeamMember($data);
        if ($errors) {
            $this->json(['errors' => $errors], 422);
            return;
        }

        $sanitized = $this->sanitizeTeamMember($data, $existing);
        $item = $this->teamMembers->update($id, $sanitized);
        $this->logActivity($params, 'update', 'team_member', 'Membre « ' . ($sanitized['fullName'] ?? '') . ' » modifié');
        $this->json($item ?? []);
    }

    public function destroy(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $existing = $this->teamMembers->find($id);
        if (!$existing) {
            $this->json(['error' => 'Membre introuvable'], 404);
            return;
        }
        $this->teamMembers->delete($id);
        $this->logActivity($params, 'delete', 'team_member', 'Membre déplacé en corbeille : ' . ($existing['fullName'] ?? ''));
        $this->json(['message' => 'Membre déplacé en corbeille (30 jours).']);
    }

    public function trash(array $params): void
    {
        $this->trashList($this->teamMembers);
    }

    public function restore(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        if (!$this->teamMembers->restore($id)) {
            $this->jsonError('NOT_FOUND', 'Élément introuvable dans la corbeille.', 404);
            return;
        }
        $this->logActivity($params, 'restore', 'team_member', 'Membre restauré (id ' . $id . ')');
        $this->json(['message' => 'Élément restauré.', 'item' => $this->teamMembers->find($id)]);
    }

    public function move(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $data = $params['_body'] ?? [];
        $direction = strtolower(trim((string)($data['direction'] ?? '')));

        if (!in_array($direction, ['up', 'down'], true)) {
            $this->json([
                'errors' => [
                    'direction' => 'Indiquez si le membre doit monter ou descendre dans la liste.',
                ],
            ], 422);
            return;
        }

        if (!$this->teamMembers->find($id)) {
            $this->json(['error' => 'Membre introuvable'], 404);
            return;
        }

        $result = $this->teamMembers->move($id, $direction);
        if ($result === null) {
            $message = $direction === 'up'
                ? 'Ce membre est déjà en haut de sa catégorie.'
                : 'Ce membre est déjà en bas de sa catégorie.';
            $this->json(['errors' => ['direction' => $message]], 422);
            return;
        }

        $this->logActivity($params, 'update', 'team_member', 'Ordre d\'affichage mis à jour');
        $this->json([
            'message' => 'Ordre d\'affichage mis à jour.',
            'item' => $result['moved'],
        ]);
    }

    /**
     * @return array<string, string>
     */
    private function validateTeamMember(array $data): array
    {
        $errors = $this->validateRequired($data, ['fullName', 'role', 'category']);

        if (empty($errors['fullName']) && isset($data['fullName'])) {
            if (!$this->validateLength((string)$data['fullName'], 2, 255)) {
                $errors['fullName'] = 'Le nom complet doit contenir entre 2 et 255 caractères.';
            }
        }

        if (empty($errors['role']) && isset($data['role'])) {
            if (!$this->validateLength((string)$data['role'], 2, 255)) {
                $errors['role'] = 'Le rôle doit contenir entre 2 et 255 caractères.';
            }
        }

        if (empty($errors['category']) && isset($data['category'])) {
            $category = (string)$data['category'];
            if (!in_array($category, self::ALLOWED_CATEGORIES, true)) {
                $errors['category'] = 'Catégorie invalide. Valeurs autorisées : coaches, board, volunteers.';
            }
        }

        if (!empty($data['bio']) && !$this->validateLength((string)$data['bio'], 0, 2000)) {
            $errors['bio'] = 'La biographie ne doit pas dépasser 2000 caractères.';
        }

        if (!empty($data['certifications']) && !$this->validateLength((string)$data['certifications'], 0, 2000)) {
            $errors['certifications'] = 'Les diplômes ne doivent pas dépasser 2000 caractères.';
        }

        return $errors;
    }

    /**
     * @return array<string, mixed>
     */
    private function sanitizeTeamMember(array $data, ?array $existing = null): array
    {
        return [
            'fullName' => $this->sanitizePlainText((string)$data['fullName'], 255),
            'role' => $this->sanitizePlainText((string)$data['role'], 255),
            'category' => $this->sanitizePlainText((string)$data['category'], 100),
            'bio' => isset($data['bio']) && $data['bio'] !== ''
                ? $this->sanitizePlainText((string)$data['bio'], 2000)
                : null,
            'photo' => isset($data['photo']) && $data['photo'] !== ''
                ? $this->sanitizeString((string)$data['photo'], 500)
                : null,
            'certifications' => isset($data['certifications']) && $data['certifications'] !== ''
                ? $this->sanitizePlainText((string)$data['certifications'], 2000)
                : null,
            'displayOrder' => isset($data['displayOrder'])
                ? (int)$data['displayOrder']
                : ($existing['displayOrder'] ?? null),
            'enabled' => array_key_exists('enabled', $data)
                ? (bool)$data['enabled']
                : ($existing['enabled'] ?? true),
        ];
    }
}
