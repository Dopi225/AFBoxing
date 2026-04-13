<?php

declare(strict_types=1);

namespace AFBoxing\Core;

/**
 * Accès HTTP normalisés (IP client derrière proxy, Bearer token).
 */
final class HttpRequest
{
    /**
     * Adresse IP du client. Si TRUSTED_PROXY=1 et X-Forwarded-For est présent,
     * utilise le premier hop (attention : ne faire confiance qu'après reverse proxy).
     */
    public static function clientIp(): string
    {
        $trusted = self::envBool('TRUSTED_PROXY', false);

        if ($trusted) {
            $xff = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
            if (is_string($xff) && $xff !== '') {
                $parts = array_map('trim', explode(',', $xff));
                $first = $parts[0] ?? '';
                if ($first !== '' && filter_var($first, FILTER_VALIDATE_IP)) {
                    return $first;
                }
            }

            $real = $_SERVER['HTTP_X_REAL_IP'] ?? '';
            if (is_string($real) && $real !== '' && filter_var($real, FILTER_VALIDATE_IP)) {
                return $real;
            }
        }

        $addr = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

        return is_string($addr) ? $addr : 'unknown';
    }

    public static function bearerToken(): ?string
    {
        $headers = self::authorizationHeader();
        if (!$headers || !preg_match('/Bearer\s+(\S+)/i', $headers, $matches)) {
            return null;
        }

        return $matches[1];
    }

    public static function authorizationHeader(): ?string
    {
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            return trim((string) $_SERVER['HTTP_AUTHORIZATION']);
        }
        if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            return trim((string) $_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
        }
        if (isset($_SERVER['HTTPS_AUTHORIZATION'])) {
            return trim((string) $_SERVER['HTTPS_AUTHORIZATION']);
        }
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

    private static function envBool(string $key, bool $default): bool
    {
        $v = $_ENV[$key] ?? getenv($key);
        if ($v === false || $v === null || $v === '') {
            return $default;
        }

        return in_array(strtolower((string) $v), ['1', 'true', 'yes', 'on'], true);
    }
}
