<?php

declare(strict_types=1);

namespace AFBoxing\Core;

/**
 * Suppression des fichiers uploadés locaux (dossier public/uploads).
 */
final class UploadedFileCleanup
{
    private const ALLOWED_FOLDERS = ['news', 'gallery', 'palmares', 'settings', 'team', 'misc'];

    public static function deleteIfLocal(?string $urlOrPath): bool
    {
        if ($urlOrPath === null || trim($urlOrPath) === '') {
            return false;
        }

        $path = trim($urlOrPath);
        if (!preg_match('#(?:^|/)uploads/([a-z]+)/([a-f0-9]{16}\.(?:jpg|jpeg|png|webp|gif))$#i', $path, $m)) {
            return false;
        }

        $folder = strtolower($m[1]);
        $filename = $m[2];
        if (!in_array($folder, self::ALLOWED_FOLDERS, true)) {
            return false;
        }

        $backendRoot = dirname(__DIR__, 2);
        $absolute = $backendRoot . '/public/uploads/' . $folder . '/' . $filename;
        $realUploads = realpath($backendRoot . '/public/uploads');
        $realFile = realpath($absolute);

        if ($realUploads === false || $realFile === false) {
            return false;
        }
        if (!str_starts_with($realFile, $realUploads)) {
            return false;
        }

        return @unlink($realFile);
    }
}
