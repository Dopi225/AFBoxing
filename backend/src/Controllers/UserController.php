<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

use AFBoxing\Models\User;

class UserController extends BaseController
{
    private const ALLOWED_ROLES = ['admin', 'editor'];

    private User $users;

    public function __construct()
    {
        $this->users = new User(afboxing_db());
    }

    public function index(array $params): void
    {
        $this->json($this->users->allSafe());
    }

    public function store(array $params): void
    {
        $data = $params['_body'] ?? [];
        $errors = $this->validateRequired($data, ['username', 'password', 'role']);
        if ($errors) {
            $this->json(['errors' => $errors], 422);
            return;
        }

        $role = $this->normalizeRole((string) $data['role'], $errors);
        if ($errors) {
            $this->json(['errors' => $errors], 422);
            return;
        }

        $username = $this->sanitizeString((string) $data['username'], 50);
        if (!$this->validateLength($username, 2, 50)) {
            $this->json(['errors' => ['username' => 'Le nom d\'utilisateur doit contenir entre 2 et 50 caractères.']], 422);
            return;
        }

        if ($this->users->usernameExists($username, null)) {
            $this->json(['errors' => ['username' => 'Ce nom d\'utilisateur est déjà utilisé.']], 422);
            return;
        }

        $password = (string) $data['password'];
        if (mb_strlen($password) < 8) {
            $this->json(['errors' => ['password' => 'Le mot de passe doit contenir au moins 8 caractères.']], 422);
            return;
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $id = $this->users->create($username, $hash, $role);
        $row = $this->users->findByIdSafe($id);
        $this->json($row, 201);
    }

    public function update(array $params): void
    {
        $id = (int) ($params['id'] ?? 0);
        if ($id < 1) {
            $this->jsonError('INVALID_ID', 'Identifiant invalide', 400);
            return;
        }

        $target = $this->users->findById($id);
        if (!$target) {
            $this->jsonError('USER_NOT_FOUND', 'Utilisateur introuvable', 404);
            return;
        }

        $data = $params['_body'] ?? [];
        if ($data === []) {
            $this->jsonError('EMPTY_BODY', 'Aucune donnée à mettre à jour', 422);
            return;
        }

        $errors = [];
        $newUsername = isset($data['username'])
            ? $this->sanitizeString((string) $data['username'], 50)
            : (string) $target['username'];

        if (isset($data['username'])) {
            if (!$this->validateLength($newUsername, 2, 50)) {
                $errors['username'] = 'Le nom d\'utilisateur doit contenir entre 2 et 50 caractères.';
            } elseif ($this->users->usernameExists($newUsername, $id)) {
                $errors['username'] = 'Ce nom d\'utilisateur est déjà utilisé.';
            }
        }

        $newRole = isset($data['role'])
            ? $this->normalizeRole((string) $data['role'], $errors)
            : (string) $target['role'];

        if ($errors) {
            $this->json(['errors' => $errors], 422);
            return;
        }

        if (($target['role'] ?? '') === 'admin' && $newRole !== 'admin' && $this->users->countByRole('admin') <= 1) {
            $this->jsonError('LAST_ADMIN_ROLE', 'Impossible de retirer le rôle administrateur au dernier compte admin.', 422);
            return;
        }

        $newPasswordHash = null;
        if (array_key_exists('password', $data) && $data['password'] !== null && $data['password'] !== '') {
            $pwd = (string) $data['password'];
            if (mb_strlen($pwd) < 8) {
                $this->json(['errors' => ['password' => 'Le mot de passe doit contenir au moins 8 caractères.']], 422);
                return;
            }
            $newPasswordHash = password_hash($pwd, PASSWORD_DEFAULT);
        }

        $this->users->update($id, $newUsername, $newRole, $newPasswordHash);
        $this->json($this->users->findByIdSafe($id));
    }

    public function destroy(array $params): void
    {
        $id = (int) ($params['id'] ?? 0);
        if ($id < 1) {
            $this->jsonError('INVALID_ID', 'Identifiant invalide', 400);
            return;
        }

        $target = $this->users->findById($id);
        if (!$target) {
            $this->jsonError('USER_NOT_FOUND', 'Utilisateur introuvable', 404);
            return;
        }

        if (($target['role'] ?? '') === 'admin' && $this->users->countByRole('admin') <= 1) {
            $this->jsonError('LAST_ADMIN_DELETE', 'Impossible de supprimer le dernier administrateur.', 422);
            return;
        }

        $auth = $params['authUser'] ?? [];
        if ((int) ($auth['id'] ?? 0) === $id) {
            $this->jsonError('SELF_DELETE_FORBIDDEN', 'Vous ne pouvez pas supprimer votre propre compte depuis cette interface.', 422);
            return;
        }

        $this->users->delete($id);
        http_response_code(204);
    }

    /**
     * @param array<string, string> $errors
     */
    private function normalizeRole(string $role, array &$errors): string
    {
        $role = strtolower(trim($role));
        if (!in_array($role, self::ALLOWED_ROLES, true)) {
            $errors['role'] = 'Rôle invalide (admin ou editor attendu).';
            return '';
        }
        return $role;
    }
}
