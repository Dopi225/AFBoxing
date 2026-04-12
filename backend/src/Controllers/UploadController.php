<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

class UploadController extends BaseController
{
    /**
     * Upload d'une image (multipart/form-data).
     * Champ fichier: "file", champ texte: "folder" (ex: news, gallery, palmares).
     */
    public function image(array $params): void
    {
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            $this->json(['error' => 'Fichier manquant ou invalide'], 422);
            return;
        }

        $folder = $_POST['folder'] ?? 'misc';
        $allowedFolders = ['news', 'gallery', 'palmares', 'settings', 'misc'];
        if (!in_array($folder, $allowedFolders, true)) {
            $folder = 'misc';
        }

        $file = $_FILES['file'];
        $maxSize = 5 * 1024 * 1024; // 5 Mo
        if ($file['size'] > $maxSize) {
            $this->json(['error' => 'Fichier trop volumineux (max 5 Mo)'], 422);
            return;
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
        $allowedMimes = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
        ];

        if (!isset($allowedMimes[$mime])) {
            $this->json(['error' => 'Type de fichier non supporté'], 422);
            return;
        }

        $extension = $allowedMimes[$mime];

        // Chemin sécurisé : toujours dans backend/public/uploads
        $backendRoot = dirname(__DIR__, 2);
        $uploadRoot = $backendRoot . '/public/uploads/' . $folder;
        if (!is_dir($uploadRoot) && !mkdir($uploadRoot, 0775, true) && !is_dir($uploadRoot)) {
            $this->json(['error' => 'Impossible de créer le dossier d’upload'], 500);
            return;
        }

        $basename = bin2hex(random_bytes(8));
        $filename = $basename . '.' . $extension;
        $destination = $uploadRoot . '/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            $this->json(['error' => 'Échec de l’upload du fichier'], 500);
            return;
        }

        // Construction de l'URL relative sécurisée
        $scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');
        // Normalisation du chemin pour éviter les traversées de répertoire
        $folder = basename($folder); // Sécurité supplémentaire
        $urlPath = $scriptDir . '/uploads/' . $folder . '/' . $filename;

        $this->json([
            'url' => $urlPath,
            'folder' => $folder,
            'name' => $filename,
        ], 201);
    }
}


