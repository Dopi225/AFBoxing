<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

use AFBoxing\Core\HttpRequest;
use AFBoxing\Core\RateLimiter;

class UploadController extends BaseController
{
    private RateLimiter $rateLimiter;

    public function __construct()
    {
        $this->rateLimiter = new RateLimiter();
    }

    /**
     * Upload d'une image (multipart/form-data).
     * Champ fichier: "file", champ texte: "folder" (ex: news, gallery, palmares).
     */
    public function image(array $params): void
    {
        $user = $params['authUser'] ?? [];
        $userId = (int) ($user['id'] ?? 0);
        $ip = HttpRequest::clientIp();
        $rateKey = 'upload_' . $ip . '_' . $userId;

        // Limite : 120 uploads / heure par couple IP + utilisateur
        if (!$this->rateLimiter->isAllowed($rateKey, 120, 3600)) {
            $retry = $this->rateLimiter->getRetryAfterSeconds($rateKey, 120, 3600);
            if ($retry > 0) {
                header('Retry-After: ' . $retry);
            }
            $this->jsonError(
                'RATE_LIMITED',
                'Trop de fichiers envoyés. Veuillez réessayer plus tard.',
                429,
                ['retry_after_seconds' => $retry]
            );
            return;
        }

        if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
            $this->jsonError('UPLOAD_MISSING', 'Fichier manquant ou invalide', 422);
            return;
        }

        $file = $_FILES['file'];
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            $this->jsonError('UPLOAD_INVALID', 'Fichier manquant ou erreur de transfert', 422);
            return;
        }

        $tmp = $file['tmp_name'] ?? '';
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            $this->jsonError('UPLOAD_REJECTED', 'Fichier de transfert invalide', 422);
            return;
        }

        $folder = $_POST['folder'] ?? 'misc';
        $allowedFolders = ['news', 'gallery', 'palmares', 'settings', 'misc'];
        if (!in_array($folder, $allowedFolders, true)) {
            $folder = 'misc';
        }

        $maxSize = 5 * 1024 * 1024; // 5 Mo
        if (($file['size'] ?? 0) > $maxSize) {
            $this->jsonError('UPLOAD_TOO_LARGE', 'Fichier trop volumineux (max 5 Mo)', 422);
            return;
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($tmp);
        $allowedMimes = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
        ];

        if ($mime === false || !isset($allowedMimes[$mime])) {
            $this->jsonError('UPLOAD_MIME', 'Type de fichier non supporté', 422);
            return;
        }

        $extension = $allowedMimes[$mime];

        $backendRoot = dirname(__DIR__, 2);
        $uploadRoot = $backendRoot . '/public/uploads/' . $folder;
        if (!is_dir($uploadRoot) && !mkdir($uploadRoot, 0775, true) && !is_dir($uploadRoot)) {
            $this->jsonError('UPLOAD_DIR', 'Impossible de créer le dossier d’upload', 500);
            return;
        }

        $basename = bin2hex(random_bytes(8));
        $filename = $basename . '.' . $extension;
        $destination = $uploadRoot . '/' . $filename;

        if (!move_uploaded_file($tmp, $destination)) {
            $this->jsonError('UPLOAD_FAILED', 'Échec de l’upload du fichier', 500);
            return;
        }

        $dims = @getimagesize($destination);
        if ($dims === false) {
            @unlink($destination);
            $this->jsonError('UPLOAD_NOT_IMAGE', 'Le fichier n’est pas une image valide', 422);
            return;
        }

        $scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');
        $folder = basename($folder);
        $urlPath = $scriptDir . '/uploads/' . $folder . '/' . $filename;

        error_log(sprintf(
            '[afboxing] upload ok user_id=%d folder=%s file=%s',
            $userId,
            $folder,
            $filename
        ));

        $this->json([
            'url' => $urlPath,
            'folder' => $folder,
            'name' => $filename,
        ], 201);
    }
}
