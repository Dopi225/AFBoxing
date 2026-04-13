<?php

declare(strict_types=1);

namespace AFBoxing\Core;

/**
 * Liste de révocation stateless des JWT (jti) après logout — stockage fichier local.
 * En cluster, préférer Redis ou une table DB partagée.
 */
final class JwtRevocationList
{
    private string $storageDir;

    public function __construct(?string $storageDir = null)
    {
        $backendRoot = dirname(__DIR__, 2);
        $this->storageDir = $storageDir ?? $backendRoot . '/storage/cache/jwt_revoked';
        if (!is_dir($this->storageDir)) {
            @mkdir($this->storageDir, 0775, true);
        }
    }

    public function isRevoked(string $jti): bool
    {
        if ($jti === '') {
            return false;
        }
        $file = $this->pathFor($jti);
        if (!is_file($file)) {
            return false;
        }
        $raw = @file_get_contents($file);
        if ($raw === false) {
            return false;
        }
        $exp = (int) trim($raw);
        if ($exp < time()) {
            @unlink($file);

            return false;
        }

        return true;
    }

    public function revoke(string $jti, int $expUnix): void
    {
        if ($jti === '') {
            return;
        }
        $file = $this->pathFor($jti);
        @file_put_contents($file, (string) $expUnix, LOCK_EX);
    }

    private function pathFor(string $jti): string
    {
        return $this->storageDir . '/' . hash('sha256', $jti) . '.rev';
    }
}
