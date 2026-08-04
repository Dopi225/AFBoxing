<?php

declare(strict_types=1);

/**
 * Configuration CORS sécurisée pour l'API.
 * En production, ne jamais autoriser '*' pour les requêtes avec credentials.
 * Seul APP_ENV=development autorise la réflexion d'origines non listées.
 */

if (!function_exists('afboxing_apply_cors')) {
    function afboxing_apply_cors(): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? null;

        // Liste des origines autorisées (à configurer via .env en production)
        $allowedOrigins = [];

        // Charge depuis .env si disponible
        $envOrigins = $_ENV['CORS_ALLOWED_ORIGINS'] ?? getenv('CORS_ALLOWED_ORIGINS');
        if ($envOrigins) {
            $allowedOrigins = array_map('trim', explode(',', (string) $envOrigins));
            $allowedOrigins = array_values(array_filter($allowedOrigins, static fn (string $o): bool => $o !== ''));
        }

        // Origines par défaut (production du club) si rien n'est configuré
        if ($allowedOrigins === []) {
            $allowedOrigins = [
                'https://afboxingclub86.com',
                'https://www.afboxingclub86.com',
            ];
        }

        $appEnv = (string) ($_ENV['APP_ENV'] ?? getenv('APP_ENV') ?: '');
        $isProduction = $appEnv === 'production';
        // Strict sauf développement explicite (évite une prod mal configurée qui reflète n'importe quelle Origin)
        $isDev = $appEnv === 'development';
        $corsStrict = ($_ENV['CORS_STRICT'] ?? getenv('CORS_STRICT')) === '1'
            || $isProduction
            || !$isDev;

        // Refuse explicitement un wildcard configuré par erreur hors développement
        if ($corsStrict) {
            $allowedOrigins = array_values(array_filter(
                $allowedOrigins,
                static fn (string $o): bool => $o !== '*' && $o !== ''
            ));
            if ($allowedOrigins === []) {
                http_response_code(500);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['error' => 'CORS misconfigured'], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }

        if ($origin && in_array($origin, $allowedOrigins, true)) {
            header("Access-Control-Allow-Origin: {$origin}");
            header('Access-Control-Allow-Credentials: true');
            header('Vary: Origin');
        } elseif (!$corsStrict && $origin) {
            // Développement uniquement : accepte l'origine fournie (jamais *)
            header("Access-Control-Allow-Origin: {$origin}");
            header('Access-Control-Allow-Credentials: true');
            header('Vary: Origin');
        } elseif (!$origin) {
            // Same-origin / curl / healthchecks : pas d'Origin → pas de blocage
        } elseif ($corsStrict) {
            http_response_code(403);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => 'Origin not allowed'], JSON_UNESCAPED_UNICODE);
            exit;
        } else {
            header('Access-Control-Allow-Origin: *');
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Max-Age: 86400'); // Cache preflight pour 24h

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
