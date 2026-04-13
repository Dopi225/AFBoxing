<?php

declare(strict_types=1);

namespace AFBoxing\Core;

/**
 * Rate limiter simple basé sur fichiers pour protéger contre les attaques brute force.
 * En production, utilisez plutôt Redis ou Memcached.
 */
class RateLimiter
{
    private string $storageDir;

    public function __construct(?string $storageDir = null)
    {
        $backendRoot = dirname(__DIR__, 2);
        $this->storageDir = $storageDir ?? $backendRoot . '/storage/cache/ratelimit';
        if (!is_dir($this->storageDir)) {
            @mkdir($this->storageDir, 0775, true);
        }
    }

    /**
     * Vérifie si une requête est autorisée selon la limite définie.
     *
     * @param string $key Identifiant unique (ex: IP, username)
     * @param int $maxAttempts Nombre maximum de tentatives
     * @param int $windowSeconds Fenêtre de temps en secondes
     * @return bool true si autorisé, false si limité
     */
    public function isAllowed(string $key, int $maxAttempts = 5, int $windowSeconds = 300): bool
    {
        $file = $this->storageDir . '/' . md5($key) . '.json';
        $now = time();

        if (!file_exists($file)) {
            $this->writeAttempt($file, [$now]);
            return true;
        }

        $data = json_decode((string)file_get_contents($file), true);
        if (!is_array($data)) {
            $data = [];
        }

        // Nettoie les tentatives expirées
        $data = array_filter($data, fn($timestamp) => ($now - $timestamp) < $windowSeconds);
        $data = array_values($data);

        if (count($data) >= $maxAttempts) {
            return false;
        }

        $data[] = $now;
        $this->writeAttempt($file, $data);
        return true;
    }

    /**
     * Secondes à attendre avant une nouvelle tentative (pour en-tête Retry-After).
     */
    public function getRetryAfterSeconds(string $key, int $maxAttempts = 5, int $windowSeconds = 300): int
    {
        $file = $this->storageDir . '/' . md5($key) . '.json';
        $now = time();

        if (!file_exists($file)) {
            return 0;
        }

        $data = json_decode((string) file_get_contents($file), true);
        if (!is_array($data) || $data === []) {
            return 0;
        }

        $data = array_filter($data, fn ($timestamp) => ($now - (int) $timestamp) < $windowSeconds);
        $data = array_values($data);
        if (count($data) < $maxAttempts) {
            return 0;
        }

        $oldest = (int) min($data);

        return max(1, $windowSeconds - ($now - $oldest));
    }

    /**
     * Retourne le nombre de tentatives restantes.
     */
    public function getRemainingAttempts(string $key, int $maxAttempts = 5, int $windowSeconds = 300): int
    {
        $file = $this->storageDir . '/' . md5($key) . '.json';
        $now = time();

        if (!file_exists($file)) {
            return $maxAttempts;
        }

        $data = json_decode((string)file_get_contents($file), true);
        if (!is_array($data)) {
            return $maxAttempts;
        }

        $data = array_filter($data, fn($timestamp) => ($now - $timestamp) < $windowSeconds);
        return max(0, $maxAttempts - count($data));
    }

    /**
     * Réinitialise le compteur pour une clé.
     */
    public function reset(string $key): void
    {
        $file = $this->storageDir . '/' . md5($key) . '.json';
        if (file_exists($file)) {
            @unlink($file);
        }
    }

    private function writeAttempt(string $file, array $attempts): void
    {
        @file_put_contents($file, json_encode($attempts), LOCK_EX);
    }

    /**
     * Nettoie les fichiers de rate limit expirés (à appeler périodiquement).
     */
    public function cleanup(int $maxAge = 3600): void
    {
        $files = glob($this->storageDir . '/*.json');
        $now = time();

        foreach ($files as $file) {
            if (filemtime($file) < ($now - $maxAge)) {
                @unlink($file);
            }
        }
    }
}

