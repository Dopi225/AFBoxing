<?php

declare(strict_types=1);

namespace AFBoxing\Middlewares;

use AFBoxing\Core\HttpRequest;
use AFBoxing\Core\JsonErrorResponse;
use AFBoxing\Core\JwtRevocationList;
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
    /**
     * @param list<string>|null $requiredRoles Si défini, le rôle de l'utilisateur doit être dans cette liste (ex. admin, editor).
     */
    public function __construct(
        private ?array $requiredRoles = null
    ) {
    }

    public function handle(): ?array
    {
        $token = HttpRequest::bearerToken();

        if ($token === null || $token === '') {
            JsonErrorResponse::send(401, 'AUTH_HEADER_MISSING', 'Authorization header missing');
            return null;
        }
        $this->loadEnvIfNeeded();
        $secret = $_ENV['JWT_SECRET'] ?? getenv('JWT_SECRET') ?: null;
        if (!$secret) {
            JsonErrorResponse::send(500, 'JWT_MISCONFIGURED', 'JWT misconfigured (JWT_SECRET missing)');
            return null;
        }

        try {
            /** @var object $decoded */
            $decoded = JWT::decode($token, new Key($secret, 'HS256'));

            if (!isset($decoded->sub)) {
                throw new \RuntimeException('Invalid token payload');
            }

            if (isset($decoded->iss) && (string) $decoded->iss !== 'afboxing-api') {
                JsonErrorResponse::send(401, 'INVALID_TOKEN', 'Invalid token issuer');
                return null;
            }

            if (isset($decoded->aud)) {
                $audOk = false;
                if (is_string($decoded->aud) && $decoded->aud === 'afboxing-api') {
                    $audOk = true;
                } elseif (is_array($decoded->aud) && in_array('afboxing-api', $decoded->aud, true)) {
                    $audOk = true;
                }
                if (!$audOk) {
                    JsonErrorResponse::send(401, 'INVALID_TOKEN', 'Invalid token audience');
                    return null;
                }
            }

            if (isset($decoded->jti) && is_string($decoded->jti) && $decoded->jti !== '') {
                $revocation = new JwtRevocationList();
                if ($revocation->isRevoked($decoded->jti)) {
                    JsonErrorResponse::send(401, 'TOKEN_REVOKED', 'Token has been revoked');
                    return null;
                }
            }

            /** @var PDO $pdo */
            $pdo = afboxing_db();
            $stmt = $pdo->prepare('SELECT id, username, role, created_at FROM users WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $decoded->sub]);
            $user = $stmt->fetch();

            if (!$user) {
                JsonErrorResponse::send(401, 'USER_NOT_FOUND', 'User not found');
                return null;
            }

            if ($this->requiredRoles !== null) {
                $role = (string) ($user['role'] ?? '');
                if (!in_array($role, $this->requiredRoles, true)) {
                    JsonErrorResponse::send(403, 'FORBIDDEN', 'Accès refusé : permissions insuffisantes.');
                    return null;
                }
            }

            return $user;
        } catch (\Throwable $e) {
            JsonErrorResponse::send(401, 'INVALID_TOKEN', 'Invalid or expired token');
            return null;
        }
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


