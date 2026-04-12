<?php

declare(strict_types=1);

use Dotenv\Dotenv;

/**
 * Initialisation de la connexion PDO à la base MySQL.
 * Utilisation de variables d'environnement (.env) pour la configuration.
 */

if (!function_exists('afboxing_db')) {
    function afboxing_db(): PDO
    {
        static $pdo = null;

        if ($pdo instanceof PDO) {
            return $pdo;
        }

        $backendRoot = dirname(__DIR__);

        // Charge les variables d'environnement, avec repli sur la racine du projet si besoin
        if (class_exists(Dotenv::class)) {
            $envLoaded = false;

            if (file_exists($backendRoot . '/.env')) {
                Dotenv::createImmutable($backendRoot)->load();
                $envLoaded = true;
            } elseif (file_exists($backendRoot . '/../.env')) {
                // fallback: .env placé à la racine du projet
                Dotenv::createImmutable($backendRoot . '/..')->load();
                $envLoaded = true;
            }

            if (!$envLoaded) {
                // Pas de .env : on continue avec les valeurs par défaut ci‑dessous
            }
        }

        $host = $_ENV['DB_HOST'] ?? '127.0.0.1';
        $port = $_ENV['DB_PORT'] ?? '3306';
        $name = $_ENV['DB_NAME'] ?? 'afboxing';
        $user = $_ENV['DB_USER'] ?? 'root';
        $pass = $_ENV['DB_PASS'] ?? '';
        $charset = $_ENV['DB_CHARSET'] ?? 'utf8mb4';

        $dsn = "mysql:host={$host};port={$port};dbname={$name};charset={$charset}";

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $pdo = new PDO($dsn, $user, $pass, $options);
        } catch (PDOException $e) {
            // Log léger côté fichier pour faciliter le debug en prod (sans afficher le DSN)
            $logDir = $backendRoot . '/storage/logs';
            if (!is_dir($logDir)) {
                @mkdir($logDir, 0775, true);
            }
            @file_put_contents(
                $logDir . '/db_error.log',
                '[' . date('c') . '] ' . $e->getMessage() . PHP_EOL,
                FILE_APPEND
            );

            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'error' => 'Database connection failed',
                'message' => 'Impossible de joindre la base de données',
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        return $pdo;
    }
}


