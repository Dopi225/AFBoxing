<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

use AFBoxing\Core\HttpRequest;
use AFBoxing\Core\RateLimiter;
use AFBoxing\Models\Contact;
use AFBoxing\Models\Setting;
use AFBoxing\Services\Mailer;
use AFBoxing\Services\MailSendException;

class ContactController extends BaseController
{
    use TrashActions;

    private Contact $contacts;
    private Setting $settings;
    private Mailer $mailer;
    private RateLimiter $rateLimiter;

    public function __construct()
    {
        $this->contacts = new Contact(afboxing_db());
        $this->settings = new Setting(afboxing_db());
        $this->mailer = new Mailer();
        $this->rateLimiter = new RateLimiter();
    }

    public function index(array $params): void
    {
        $this->json($this->contacts->all());
    }

    public function submit(array $params): void
    {
        // Rate limiting : 3 messages par heure par IP
        $ip = HttpRequest::clientIp();
        $key = 'contact_' . $ip;

        if (!$this->rateLimiter->isAllowed($key, 3, 3600)) {
            $retry = $this->rateLimiter->getRetryAfterSeconds($key, 3, 3600);
            if ($retry > 0) {
                header('Retry-After: ' . $retry);
            }
            $this->jsonError(
                'RATE_LIMITED',
                'Trop de messages envoyés. Veuillez réessayer plus tard.',
                429,
                ['retry_after_seconds' => $retry]
            );
            return;
        }

        $data = $params['_body'] ?? [];
        $errors = $this->validateRequired($data, ['name', 'email', 'message']);

        if (empty($errors['email']) && isset($data['email'])) {
            if (!$this->validateEmail($data['email'])) {
                $errors['email'] = 'Format d\'email invalide.';
            }
        }

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
        if (!$this->contacts->find($id)) {
            $this->json(['error' => 'Message introuvable'], 404);
            return;
        }
        $this->contacts->markAsRead($id);
        $this->json(['message' => 'Message marqué comme lu.']);
    }

    /**
     * Envoie une réponse email au contact, puis enregistre le fil.
     * En cas d'échec d'envoi : aucune écriture, message non marqué « répondu ».
     */
    public function reply(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $contact = $this->contacts->find($id);
        if (!$contact) {
            $this->json(['error' => 'Message introuvable'], 404);
            return;
        }

        $data = $params['_body'] ?? [];
        $errors = $this->validateRequired($data, ['body']);

        if (empty($errors['body']) && isset($data['body'])) {
            if (!$this->validateLength((string)$data['body'], 10, 5000)) {
                $errors['body'] = 'La réponse doit contenir entre 10 et 5000 caractères.';
            }
        }

        if ($errors) {
            $this->json(['errors' => $errors], 422);
            return;
        }

        if (!$this->validateEmail((string)$contact['email'])) {
            $this->jsonError(
                'INVALID_CONTACT_EMAIL',
                'L\'adresse email du contact n\'est pas valide. Vérifiez-la ou demandez au contact de vous réécrire.',
                422
            );
            return;
        }

        $body = $this->sanitizeString((string)$data['body'], 5000);
        $fromEmail = trim((string)($this->settings->get('contact.email') ?? ''));
        $fromName = trim((string)($this->settings->get('mail.from_name') ?? ''));
        if ($fromName === '') {
            $fromName = trim((string)($this->settings->get('site.name') ?? '')) ?: 'AF Boxing Club 86';
        }
        if ($fromEmail === '') {
            $this->jsonError(
                'MISSING_FROM_EMAIL',
                'Indiquez l\'email du club dans Paramètres avant d\'envoyer une réponse.',
                422
            );
            return;
        }

        $siteName = trim((string)($this->settings->get('site.name') ?? '')) ?: 'AF Boxing Club 86';
        $subject = 'Re: Votre message à ' . $siteName;

        $authUser = $params['authUser'] ?? [];
        $sentByName = (string)($authUser['username'] ?? 'Admin');
        $sentByUserId = isset($authUser['id']) ? (int)$authUser['id'] : null;

        $emailBody = $this->buildReplyEmailBody($body, $contact, $fromName, $siteName);

        try {
            $this->mailer->send(
                (string)$contact['email'],
                (string)$contact['name'],
                $subject,
                $emailBody,
                $fromEmail,
                $fromName
            );
        } catch (MailSendException $e) {
            $this->jsonError('MAIL_SEND_FAILED', $e->getMessage(), 502);
            return;
        }

        $result = $this->contacts->addReply($id, $body, $sentByUserId, $sentByName);

        $this->json([
            'message' => 'Réponse envoyée.',
            'reply' => $result['reply'],
            'contact' => $result['contact'],
        ], 201);
    }

    public function destroy(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $this->contacts->delete($id);
        $this->json(['message' => 'Message déplacé en corbeille (30 jours).']);
    }

    public function trash(array $params): void
    {
        $this->trashList($this->contacts);
    }

    public function restore(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $this->restoreItem($this->contacts, $id);
    }

    private function buildReplyEmailBody(string $replyBody, array $contact, string $fromName, string $siteName): string
    {
        $lines = [
            'Bonjour ' . ($contact['name'] ?: '') . ',',
            '',
            $replyBody,
            '',
            '—',
            $fromName,
            $siteName,
            '',
            '---',
            'Votre message initial :',
            (string)$contact['message'],
        ];
        return implode("\n", $lines);
    }
}
