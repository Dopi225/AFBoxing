<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

use AFBoxing\Core\RateLimiter;
use AFBoxing\Models\Contact;

class ContactController extends BaseController
{
    private Contact $contacts;
    private RateLimiter $rateLimiter;

    public function __construct()
    {
        $this->contacts = new Contact(afboxing_db());
        $this->rateLimiter = new RateLimiter();
    }

    public function index(array $params): void
    {
        $items = $this->contacts->all();
        $this->json($items);
    }

    public function submit(array $params): void
    {
        // Rate limiting : 3 messages par heure par IP
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $key = 'contact_' . $ip;
        
        if (!$this->rateLimiter->isAllowed($key, 3, 3600)) {
            $this->json([
                'error' => 'Trop de messages envoyés. Veuillez réessayer plus tard.',
            ], 429);
            return;
        }

        $data = $params['_body'] ?? [];
        $errors = $this->validateRequired($data, ['name', 'email', 'message']);
        
        // Validation email
        if (empty($errors['email']) && isset($data['email'])) {
            if (!$this->validateEmail($data['email'])) {
                $errors['email'] = 'Format d\'email invalide.';
            }
        }
        
        // Validation longueurs
        if (empty($errors['name']) && isset($data['name'])) {
            if (!$this->validateLength($data['name'], 2, 255)) {
                $errors['name'] = 'Le nom doit contenir entre 2 et 255 caractères.';
            }
        }
        
        if (empty($errors['message']) && isset($data['message'])) {
            if (!$this->validateLength($data['message'], 10, 5000)) {
                $errors['message'] = 'Le message doit contenir entre 10 et 5000 caractères.';
            }
        }
        
        if ($errors) {
            $this->json(['errors' => $errors], 422);
            return;
        }

        // Sanitization
        $sanitized = [
            'name' => $this->sanitizeString($data['name'], 255),
            'email' => filter_var($data['email'], FILTER_SANITIZE_EMAIL),
            'message' => $this->sanitizeString($data['message'], 5000),
        ];

        $item = $this->contacts->create($sanitized);
        $this->json($item, 201);
    }

    public function markAsRead(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $this->contacts->markAsRead($id);
        $this->json(['message' => 'Message marqué comme lu.']);
    }

    public function destroy(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $this->contacts->delete($id);
        $this->json(['message' => 'Message supprimé.']);
    }
}


