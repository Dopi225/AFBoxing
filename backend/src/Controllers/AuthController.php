<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

use AFBoxing\Core\RateLimiter;
use Firebase\JWT\JWT;
use PDO;

class AuthController extends BaseController
{
    private RateLimiter $rateLimiter;

    public function __construct()
    {
        $this->rateLimiter = new RateLimiter();
    }

    public function login(array $params): void
    {
        $data = $params['_body'] ?? [];
        $errors = $this->validateRequired($data, ['username', 'password']);
        if ($errors) {
            $this->json(['errors' => $errors], 422);
            return;
        }

        // Rate limiting : 5 tentatives par 15 minutes par IP
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $key = 'login_' . $ip . '_' . ($data['username'] ?? '');
        
        if (!$this->rateLimiter->isAllowed($key, 5, 900)) {
            $remaining = $this->rateLimiter->getRemainingAttempts($key, 5, 900);
            $this->json([
                'error' => 'Trop de tentatives de connexion. Veuillez réessayer dans quelques minutes.',
                'remaining_attempts' => $remaining,
            ], 429);
            return;
        }

        /** @var PDO $pdo */
        $pdo = afboxing_db();

        // Sanitization username
        $username = $this->sanitizeString($data['username'], 50);
        
        $stmt = $pdo->prepare('SELECT id, username, password, role FROM users WHERE username = :username LIMIT 1');
        $stmt->execute(['username' => $username]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($data['password'], $user['password'])) {
            // Ne pas révéler si l'utilisateur existe ou non (sécurité)
            $this->json(['error' => 'Identifiants invalides'], 401);
            return;
        }

        // Succès : on réinitialise le rate limiter pour cette clé
        $this->rateLimiter->reset($key);

        $now = time();
        $exp = $now + 60 * 60 * 3; // 3h
        $secret = $_ENV['JWT_SECRET'] ?? getenv('JWT_SECRET') ?: null;
        if (!$secret) {
            $this->json(['error' => 'JWT misconfigured (JWT_SECRET missing)'], 500);
            return;
        }

        $payload = [
            'iss' => 'afboxing-api',
            'sub' => $user['id'],
            'iat' => $now,
            'exp' => $exp,
            'role' => $user['role'],
        ];

        $token = JWT::encode($payload, $secret, 'HS256');

        $this->json([
            'token' => $token,
            'expires_at' => $exp,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'role' => $user['role'],
            ],
        ]);
    }

    public function logout(array $params): void
    {
        // Côté API stateless, le "logout" est géré côté client (suppression du token).
        $this->json(['message' => 'Déconnexion effectuée.']);
    }

    public function me(array $params): void
    {
        $user = $params['authUser'] ?? null;
        if (!$user) {
            $this->json(['error' => 'Non authentifié'], 401);
            return;
        }

        $this->json(['user' => $user]);
    }
}


