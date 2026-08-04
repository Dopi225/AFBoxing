<?php

declare(strict_types=1);

/**
 * Rotation / purge des logs applicatifs.
 * À planifier en cron hebdomadaire, ex. :
 *   0 3 * * 0 php /chemin/vers/backend/scripts/rotate-logs.php
 *
 * - Conserve les RotatingFileHandler Monolog (app-*.log) déjà gérés
 * - Tronque / archive php_error.log et mail.log s'ils dépassent MAX_BYTES
 */

$logDir = dirname(__DIR__) . '/storage/logs';
$maxBytes = 5 * 1024 * 1024; // 5 Mo
$keepArchives = 10;

if (!is_dir($logDir)) {
    fwrite(STDERR, "Pas de dossier logs : {$logDir}\n");
    exit(0);
}

$targets = ['php_error.log', 'mail.log'];

foreach ($targets as $name) {
    $path = $logDir . '/' . $name;
    if (!is_file($path)) {
        continue;
    }
    $size = filesize($path);
    if ($size === false || $size < $maxBytes) {
        continue;
    }
    $archive = sprintf('%s/%s.%s.bak', $logDir, pathinfo($name, PATHINFO_FILENAME), date('Ymd_His'));
    if (!@rename($path, $archive)) {
        fwrite(STDERR, "Impossible d'archiver {$path}\n");
        continue;
    }
    @file_put_contents($path, '');
    echo "Archivé : {$archive}\n";
}

// Purge des .bak trop nombreux
$baks = glob($logDir . '/*.bak') ?: [];
usort($baks, static fn (string $a, string $b): int => filemtime($b) <=> filemtime($a));
foreach (array_slice($baks, $keepArchives) as $old) {
    @unlink($old);
    echo "Supprimé : {$old}\n";
}

// Purge des app-*.log Monolog au-delà de 40 fichiers (filet de sécurité)
$rotated = glob($logDir . '/app-*.log') ?: [];
usort($rotated, static fn (string $a, string $b): int => filemtime($b) <=> filemtime($a));
foreach (array_slice($rotated, 40) as $old) {
    @unlink($old);
    echo "Supprimé : {$old}\n";
}

echo "Rotation logs terminée.\n";
