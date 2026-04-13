<?php

declare(strict_types=1);

/**
 * Configuration CORS sécurisée pour l'API.
 * En production, ne jamais autoriser '*' pour les requêtes avec credentials.
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
            $allowedOrigins = array_map('trim', explode(',', $envOrigins));
        }

        // Origines par défaut (développement local)
        if (empty($allowedOrigins)) {
            $allowedOrigins = [
                'http://localhost',
                'http://localhost:5173',
                'http://localhost:3000',
                'http://127.0.0.1',
                'http://127.0.0.1:5173',
                'https://afboxing86.simacogroup.com',
            ];
        }

        // En production, on refuse les requêtes sans origine valide
        $isProduction = ($_ENV['APP_ENV'] ?? getenv('APP_ENV')) === 'production';
        $corsStrict = ($_ENV['CORS_STRICT'] ?? getenv('CORS_STRICT')) === '1';

        if ($origin && in_array($origin, $allowedOrigins, true)) {
            header("Access-Control-Allow-Origin: {$origin}");
            header('Access-Control-Allow-Credentials: true');
        } elseif (!$isProduction && !$corsStrict && $origin) {
            // En développement (sans CORS_STRICT), on accepte l'origine si elle est fournie (mais pas *)
            header("Access-Control-Allow-Origin: {$origin}");
            header('Access-Control-Allow-Credentials: true');
        } elseif (!$isProduction && !$corsStrict) {
            // En développement uniquement, fallback sur * si pas d'origine
            header('Access-Control-Allow-Origin: *');
        } else {
            // En production, on refuse si l'origine n'est pas autorisée
            http_response_code(403);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => 'Origin not allowed'], JSON_UNESCAPED_UNICODE);
            exit;
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


