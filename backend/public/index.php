<?php

declare(strict_types=1);


require_once dirname(__DIR__) . '/vendor/autoload.php';
require_once dirname(__DIR__) . '/config/database.php';
require_once dirname(__DIR__) . '/config/cors.php';

use AFBoxing\Core\JsonErrorResponse;
use AFBoxing\Core\Router;
use Monolog\Handler\StreamHandler;
use Monolog\Level;
use Monolog\Logger;
use AFBoxing\Controllers\AuthController;
use AFBoxing\Controllers\NewsController;
use AFBoxing\Controllers\GalleryController;
use AFBoxing\Controllers\ScheduleController;
use AFBoxing\Controllers\PalmaresController;
use AFBoxing\Controllers\ContactController;
use AFBoxing\Controllers\UploadController;
use AFBoxing\Controllers\ActivityController;
use AFBoxing\Controllers\SettingController;
use AFBoxing\Controllers\ActivityLogController;
use AFBoxing\Controllers\PricingController;
use AFBoxing\Controllers\UserController;
use AFBoxing\Middlewares\AuthMiddleware;

$logDir = dirname(__DIR__) . '/storage/logs';
if (!is_dir($logDir)) {
    @mkdir($logDir, 0775, true);
}
@ini_set('log_errors', '1');
@ini_set('error_log', $logDir . '/php_error.log');

$logger = new Logger('afboxing');
$logger->pushHandler(new StreamHandler($logDir . '/app.log', Level::Debug));

set_exception_handler(static function (\Throwable $e) use ($logDir, $logger): void {
    $isProduction = ($_ENV['APP_ENV'] ?? getenv('APP_ENV')) === 'production';

    $logger->error($e->getMessage(), [
        'exception' => $e::class,
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $isProduction ? null : $e->getTraceAsString(),
    ]);

    @file_put_contents(
        $logDir . '/php_error.log',
        '[' . date('c') . '] ' . $e::class . ': ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() . PHP_EOL,
        FILE_APPEND
    );

    $message = $isProduction
        ? 'Internal Server Error'
        : $e->getMessage() . ' in ' . basename($e->getFile()) . ':' . $e->getLine();

    JsonErrorResponse::send(500, 'INTERNAL_ERROR', $message);
    exit;
});

afboxing_apply_cors();

header('Content-Type: application/json; charset=utf-8');

$router = new Router();

// Authentification JWT : null = tout utilisateur connecté ; sinon rôles autorisés
$authAny = new AuthMiddleware();
$authStaff = new AuthMiddleware(['admin', 'editor']);
$authAdmin = new AuthMiddleware(['admin']);

// Auth
$router->post('/api/auth/login', [AuthController::class, 'login']);
$router->post('/api/auth/logout', [AuthController::class, 'logout'])
    ->middleware($authAny);
$router->get('/api/auth/me', [AuthController::class, 'me'])
    ->middleware($authAny);

// News
$router->get('/api/news', [NewsController::class, 'index']);
$router->get('/api/news/{id}', [NewsController::class, 'show']);
$router->post('/api/news', [NewsController::class, 'store'])
    ->middleware($authStaff);
$router->put('/api/news/{id}', [NewsController::class, 'update'])
    ->middleware($authStaff);
$router->delete('/api/news/{id}', [NewsController::class, 'destroy'])
    ->middleware($authStaff);

// Gallery
$router->get('/api/gallery', [GalleryController::class, 'index']);
$router->post('/api/gallery', [GalleryController::class, 'store'])
    ->middleware($authStaff);
$router->put('/api/gallery/{id}', [GalleryController::class, 'update'])
    ->middleware($authStaff);
$router->delete('/api/gallery/{id}', [GalleryController::class, 'destroy'])
    ->middleware($authStaff);

// Schedule
$router->get('/api/schedule', [ScheduleController::class, 'index']);
$router->post('/api/schedule', [ScheduleController::class, 'store'])
    ->middleware($authStaff);
$router->put('/api/schedule/{id}', [ScheduleController::class, 'update'])
    ->middleware($authStaff);
$router->delete('/api/schedule/{id}', [ScheduleController::class, 'destroy'])
    ->middleware($authStaff);

// Palmares
$router->get('/api/palmares', [PalmaresController::class, 'index']);
$router->post('/api/palmares', [PalmaresController::class, 'store'])
    ->middleware($authStaff);
$router->put('/api/palmares/{id}', [PalmaresController::class, 'update'])
    ->middleware($authStaff);
$router->delete('/api/palmares/{id}', [PalmaresController::class, 'destroy'])
    ->middleware($authStaff);

// Contacts
$router->post('/api/contact', [ContactController::class, 'submit']);
$router->get('/api/contacts', [ContactController::class, 'index'])
    ->middleware($authAdmin);
$router->put('/api/contacts/{id}/read', [ContactController::class, 'markAsRead'])
    ->middleware($authAdmin);
$router->delete('/api/contacts/{id}', [ContactController::class, 'destroy'])
    ->middleware($authAdmin);

// Activities
$router->get('/api/activities', [ActivityController::class, 'index']);
$router->get('/api/activities/{id}', [ActivityController::class, 'show']);
$router->post('/api/activities', [ActivityController::class, 'store'])
    ->middleware($authStaff);
$router->put('/api/activities/{id}', [ActivityController::class, 'update'])
    ->middleware($authStaff);
$router->delete('/api/activities/{id}', [ActivityController::class, 'destroy'])
    ->middleware($authStaff);

// Settings
// GET est public pour que le frontend puisse afficher les paramètres (contact, réseaux sociaux)
$router->get('/api/settings', [SettingController::class, 'index']);
$router->get('/api/settings/{key}', [SettingController::class, 'show']);
// POST et DELETE : administrateur uniquement
$router->post('/api/settings', [SettingController::class, 'store'])
    ->middleware($authAdmin);
$router->delete('/api/settings/{key}', [SettingController::class, 'destroy'])
    ->middleware($authAdmin);

// Activity Log (écriture : staff pour tracer les actions éditeur ; lecture / purge : admin)
$router->get('/api/activity-log', [ActivityLogController::class, 'index'])
    ->middleware($authAdmin);
$router->post('/api/activity-log', [ActivityLogController::class, 'store'])
    ->middleware($authStaff);
$router->delete('/api/activity-log', [ActivityLogController::class, 'clear'])
    ->middleware($authAdmin);
$router->get('/api/activity-log/count', [ActivityLogController::class, 'count'])
    ->middleware($authAdmin);

// Pricing
$router->get('/api/pricing', [PricingController::class, 'index']);
$router->get('/api/pricing/{key}', [PricingController::class, 'show']);
$router->post('/api/pricing', [PricingController::class, 'store'])
    ->middleware($authAdmin);
$router->put('/api/pricing/{key}', [PricingController::class, 'update'])
    ->middleware($authAdmin);
$router->delete('/api/pricing/{key}', [PricingController::class, 'destroy'])
    ->middleware($authAdmin);

// Uploads (images) — staff (éditeurs inclus)
$router->post('/api/upload', [UploadController::class, 'image'])
    ->middleware($authStaff);

// Utilisateurs staff (admin uniquement)
$router->get('/api/users', [UserController::class, 'index'])
    ->middleware($authAdmin);
$router->post('/api/users', [UserController::class, 'store'])
    ->middleware($authAdmin);
$router->put('/api/users/{id}', [UserController::class, 'update'])
    ->middleware($authAdmin);
$router->delete('/api/users/{id}', [UserController::class, 'destroy'])
    ->middleware($authAdmin);

// Dispatch de la requête
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
// Supporte les déploiements en sous-dossier (ex: /AF/AFBoxing/api/...)
// et les appels directs via /backend/public/api/... en ramenant toujours à /api/...
$apiPos = strpos($path, '/api/');
if ($apiPos !== false && $apiPos > 0) {
    $path = substr($path, $apiPos);
}

$router->dispatch(
    $_SERVER['REQUEST_METHOD'] ?? 'GET',
    $path
);


