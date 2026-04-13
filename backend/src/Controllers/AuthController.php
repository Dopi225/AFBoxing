<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

use AFBoxing\Core\HttpRequest;
use AFBoxing\Core\JwtRevocationList;
use AFBoxing\Core\RateLimiter;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
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

        // Rate limiting : 5 tentatives par 15 minutes par IP (+ username)
        $ip = HttpRequest::clientIp();
        $key = 'login_' . $ip . '_' . ($data['username'] ?? '');

        if (!$this->rateLimiter->isAllowed($key, 5, 900)) {
            $remaining = $this->rateLimiter->getRemainingAttempts($key, 5, 900);
            $retry = $this->rateLimiter->getRetryAfterSeconds($key, 5, 900);
            if ($retry > 0) {
                header('Retry-After: ' . $retry);
            }
            $this->jsonError(
                'RATE_LIMITED',
                'Trop de tentatives de connexion. Veuillez réessayer dans quelques minutes.',
                429,
                ['remaining_attempts' => $remaining, 'retry_after_seconds' => $retry]
            );
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
            $this->jsonError('INVALID_CREDENTIALS', 'Identifiants invalides', 401);
            return;
        }

        // Succès : on réinitialise le rate limiter pour cette clé
        $this->rateLimiter->reset($key);

        $now = time();
        $exp = $now + 60 * 60 * 3; // 3h
        $secret = $_ENV['JWT_SECRET'] ?? getenv('JWT_SECRET') ?: null;
        if (!$secret) {
            $this->jsonError('JWT_MISCONFIGURED', 'Configuration JWT invalide (JWT_SECRET manquant)', 500);
            return;
        }

        $payload = [
            'iss' => 'afboxing-api',
            'aud' => 'afboxing-api',
            'sub' => $user['id'],
            'iat' => $now,
            'exp' => $exp,
            'jti' => bin2hex(random_bytes(16)),
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
        $token = HttpRequest::bearerToken();
        if ($token) {
            $this->loadEnvForJwt();
            $secret = $_ENV['JWT_SECRET'] ?? getenv('JWT_SECRET') ?: null;
            if ($secret) {
                try {
                    /** @var object $decoded */
                    $decoded = JWT::decode($token, new Key($secret, 'HS256'));
                    if (isset($decoded->jti) && is_string($decoded->jti) && $decoded->jti !== '') {
                        $exp = isset($decoded->exp) ? (int) $decoded->exp : time() + 3600;
                        (new JwtRevocationList())->revoke($decoded->jti, $exp);
                    }
                } catch (\Throwable) {
                    // Token déjà invalidé côté client : on renvoie quand même succès.
                }
            }
        }

        $this->json(['message' => 'Déconnexion effectuée.']);
    }

    private function loadEnvForJwt(): void
    {
        if (!empty($_ENV['JWT_SECRET']) || getenv('JWT_SECRET')) {
            return;
        }
        if (!class_exists(\Dotenv\Dotenv::class)) {
            return;
        }
        $backendRoot = dirname(__DIR__, 2);
        if (file_exists($backendRoot . '/.env')) {
            \Dotenv\Dotenv::createImmutable($backendRoot)->load();
            return;
        }
        if (file_exists($backendRoot . '/../.env')) {
            \Dotenv\Dotenv::createImmutable($backendRoot . '/..')->load();
        }
    }

    public function me(array $params): void
    {
        $user = $params['authUser'] ?? null;
        if (!$user) {
            $this->jsonError('UNAUTHORIZED', 'Non authentifié', 401);
            return;
        }

        $this->json(['user' => $user]);
    }
}


