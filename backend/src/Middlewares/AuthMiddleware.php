<?php

declare(strict_types=1);

namespace AFBoxing\Middlewares;

use Dotenv\Dotenv;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use PDO;

interface AuthMiddlewareInterface
{
    /**
     * Vérifie le token JWT et retourne l'utilisateur authentifié ou null.
     *
     * @return array<string, mixed>|null
     */
    public function handle(): ?array;
}

class AuthMiddleware implements AuthMiddlewareInterface
{
    public function handle(): ?array
    {
        header('Content-Type: application/json; charset=utf-8');

        $headers = $this->getAuthorizationHeader();

        if (!$headers || !preg_match('/Bearer\s+(\S+)/i', $headers, $matches)) {
            http_response_code(401);
            echo json_encode(['error' => 'Authorization header missing'], JSON_UNESCAPED_UNICODE);
            return null;
        }

        $token = $matches[1];
        $this->loadEnvIfNeeded();
        $secret = $_ENV['JWT_SECRET'] ?? getenv('JWT_SECRET') ?: null;
        if (!$secret) {
            http_response_code(500);
            echo json_encode(['error' => 'JWT misconfigured (JWT_SECRET missing)'], JSON_UNESCAPED_UNICODE);
            return null;
        }

        try {
            /** @var object $decoded */
            $decoded = JWT::decode($token, new Key($secret, 'HS256'));

            if (!isset($decoded->sub)) {
                throw new \RuntimeException('Invalid token payload');
            }

            /** @var PDO $pdo */
            $pdo = afboxing_db();
            $stmt = $pdo->prepare('SELECT id, username, role, created_at FROM users WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $decoded->sub]);
            $user = $stmt->fetch();

            if (!$user) {
                http_response_code(401);
                echo json_encode(['error' => 'User not found'], JSON_UNESCAPED_UNICODE);
                return null;
            }

            return $user;
        } catch (\Throwable $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid or expired token'], JSON_UNESCAPED_UNICODE);
            return null;
        }
    }

    private function getAuthorizationHeader(): ?string
    {
        // Cas le plus fréquent (Apache / PHP-FPM) : HTTP_AUTHORIZATION
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            return trim((string) $_SERVER['HTTP_AUTHORIZATION']);
        }

        // Selon la config Apache + FastCGI, l'header peut être préfixé REDIRECT_
        if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            return trim((string) $_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
        }

        // Certains environnements utilisent HTTPS_AUTHORIZATION (rare, mais on garde en dernier recours)
        if (isset($_SERVER['HTTPS_AUTHORIZATION'])) {
            return trim((string) $_SERVER['HTTPS_AUTHORIZATION']);
        }

        // getallheaders() : souvent dispo même quand apache_request_headers() ne l'est pas
        if (function_exists('getallheaders')) {
            /** @var array<string, string> $headers */
            $headers = getallheaders();
            foreach ($headers as $k => $v) {
                if (strtolower((string) $k) === 'authorization') {
                    return trim((string) $v);
                }
            }
        }

        if (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            foreach ($headers as $k => $v) {
                if (strtolower((string) $k) === 'authorization') {
                    return trim((string) $v);
                }
            }
        }

        return null;
    }

    private function loadEnvIfNeeded(): void
    {
        // Évite de dépendre de afboxing_db() (qui charge le .env) car on a besoin du secret AVANT la connexion DB.
        if (!empty($_ENV['JWT_SECRET']) || getenv('JWT_SECRET')) {
            return;
        }

        if (!class_exists(Dotenv::class)) {
            return;
        }

        $backendRoot = dirname(__DIR__, 2); // .../backend
        if (file_exists($backendRoot . '/.env')) {
            Dotenv::createImmutable($backendRoot)->load();
            return;
        }

        // fallback: .env à la racine du projet
        if (file_exists($backendRoot . '/../.env')) {
            Dotenv::createImmutable($backendRoot . '/..')->load();
        }
    }
}


