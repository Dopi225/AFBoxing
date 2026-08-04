<?php

declare(strict_types=1);

/**
 * Purge la corbeille soft-delete (> 30 jours).
 *
 * Usage CLI :
 *   php bin/purge-trash.php
 *
 * Ou planifier (cron / Planificateur de tâches Windows) une fois par jour.
 */

require_once dirname(__DIR__) . '/vendor/autoload.php';
require_once dirname(__DIR__) . '/config/database.php';

use AFBoxing\Core\SoftDelete;

$pdo = afboxing_db();
$result = SoftDelete::purgeAllExpired($pdo);

$total = array_sum($result);
echo '[' . date('c') . "] Soft-delete purge: {$total} row(s)\n";
foreach ($result as $table => $count) {
    if ($count > 0) {
        echo "  - {$table}: {$count}\n";
    }
}

exit(0);
