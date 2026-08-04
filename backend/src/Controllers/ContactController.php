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
    use LogsActivity;

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
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $perPage = isset($_GET['per_page']) ? min(200, max(1, (int)$_GET['per_page'])) : 50;
        $total = $this->contacts->countAll();
        $items = $this->contacts->paginate($page, $perPage);
        $this->json([
            'data' => $items,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => $perPage > 0 ? (int)ceil($total / $perPage) : 0,
            ],
        ]);
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

        // Honeypot anti-spam : champs que seuls les bots remplissent
        $honeypot = trim((string)($data['website'] ?? $data['company'] ?? $data['url'] ?? ''));
        if ($honeypot !== '') {
            // Succès factice pour ne pas guider les bots
            $this->json(['id' => 0, 'message' => 'Message reçu.'], 201);
            return;
        }

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
            'name' => $this->sanitizePlainText((string)$data['name'], 255),
            'email' => filter_var((string)$data['email'], FILTER_SANITIZE_EMAIL) ?: '',
            'message' => $this->sanitizePlainText((string)$data['message'], 5000),
        ];

        if ($sanitized['email'] === '' || !$this->validateEmail($sanitized['email'])) {
            $this->json(['errors' => ['email' => 'Format d\'email invalide.']], 422);
            return;
        }

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
     * Enregistre une réponse pending, envoie l'email, puis finalise (sent + is_replied).
     * Idempotence via clé client : un double-clic renvoie le même résultat.
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

        $idempotencyKey = isset($data['idempotencyKey']) && is_string($data['idempotencyKey'])
            ? trim($data['idempotencyKey'])
            : '';
        if ($idempotencyKey !== '' && !$this->validateLength($idempotencyKey, 8, 64)) {
            $this->json(['errors' => ['idempotencyKey' => 'Clé d\'idempotence invalide.']], 422);
            return;
        }
        if ($idempotencyKey === '') {
            $idempotencyKey = null;
        }

        // Réponse déjà finalisée avec cette clé → retourner le résultat sans renvoyer l'email
        if ($idempotencyKey !== null) {
            $this->contacts->expireStalePendingReplies(120);
            $existing = $this->contacts->findReplyByIdempotencyKey($idempotencyKey);
            if ($existing && ($existing['status'] ?? '') === 'sent') {
                $this->json([
                    'message' => 'Réponse déjà envoyée.',
                    'reply' => $existing,
                    'contact' => $this->contacts->find($id),
                    'idempotent' => true,
                ], 200);
                return;
            }
            if ($existing && ($existing['status'] ?? '') === 'pending') {
                $createdAt = $existing['createdAt'] ?? null;
                $age = is_string($createdAt) ? (time() - strtotime($createdAt)) : 0;
                if ($age > 120) {
                    $this->contacts->failReply((int)($existing['id'] ?? 0));
                    // Retry autorisé après expiration du pending orphelin
                } else {
                    $this->jsonError(
                        'REPLY_IN_PROGRESS',
                        'Une réponse est déjà en cours d\'envoi pour cette demande. Patientez quelques secondes.',
                        409
                    );
                    return;
                }
            }
        }

        // Anti double-clic serveur (même sans clé client)
        $rateKey = 'contact_reply_' . $id . '_' . ($sentByUserId ?? 0);
        if (!$this->rateLimiter->isAllowed($rateKey, 1, 15)) {
            $this->jsonError(
                'REPLY_RATE_LIMITED',
                'Patientez quelques secondes avant de renvoyer une réponse à ce message.',
                429
            );
            return;
        }

        try {
            $pending = $this->contacts->createPendingReply(
                $id,
                $body,
                $sentByUserId,
                $sentByName,
                $idempotencyKey
            );
        } catch (\PDOException $e) {
            // Conflit unique sur idempotency_key (course double-clic)
            if ((int)$e->getCode() === 23000 && $idempotencyKey !== null) {
                $existing = $this->contacts->findReplyByIdempotencyKey($idempotencyKey);
                if ($existing && ($existing['status'] ?? '') === 'sent') {
                    $this->json([
                        'message' => 'Réponse déjà envoyée.',
                        'reply' => $existing,
                        'contact' => $this->contacts->find($id),
                        'idempotent' => true,
                    ], 200);
                    return;
                }
            }
            error_log('[afboxing] contact reply pending: ' . $e->getMessage());
            $this->jsonError('REPLY_SAVE_FAILED', 'Impossible d\'enregistrer la réponse. Réessayez.', 500);
            return;
        }

        $replyId = (int)($pending['reply']['id'] ?? 0);
        $legacyMode = !empty($pending['legacy']);
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
            if ($replyId > 0) {
                $this->contacts->failReply($replyId);
            }
            $this->jsonError('MAIL_SEND_FAILED', $e->getMessage(), 502);
            return;
        }

        if ($legacyMode) {
            $result = $this->contacts->addReply($id, $body, $sentByUserId, $sentByName);
            $this->logActivity(
                $params,
                'create',
                'contact',
                'Réponse envoyée à ' . ($contact['name'] ?? 'un contact')
            );
            $this->json([
                'message' => 'Réponse envoyée.',
                'reply' => $result['reply'],
                'contact' => $result['contact'],
            ], 201);
            return;
        }

        try {
            $result = $this->contacts->finalizeReply($replyId, $id);
        } catch (\Throwable $e) {
            // Email déjà parti : on logue critique ; le contact a reçu le mail
            error_log('[afboxing] contact reply finalize after mail OK: ' . $e->getMessage());
            $this->json([
                'message' => 'Réponse envoyée (enregistrement partiel — vérifiez le fil).',
                'reply' => $pending['reply'],
                'contact' => $this->contacts->find($id),
            ], 201);
            return;
        }

        $this->logActivity(
            $params,
            'create',
            'contact',
            'Réponse envoyée à ' . ($contact['name'] ?? 'un contact')
        );
        $this->json([
            'message' => 'Réponse envoyée.',
            'reply' => $result['reply'],
            'contact' => $result['contact'],
        ], 201);
    }

    public function destroy(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        if (!$this->contacts->find($id)) {
            $this->json(['error' => 'Message introuvable'], 404);
            return;
        }
        $this->contacts->delete($id);
        $this->logActivity($params, 'delete', 'contact', 'Message déplacé en corbeille (id ' . $id . ')');
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
