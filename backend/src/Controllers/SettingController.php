<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

use AFBoxing\Models\Setting;

class SettingController extends BaseController
{
    use LogsActivity;

    /** Clés autorisées et règles de validation associées. */
    private const ALLOWED_KEYS = [
        'contact.address' => ['max' => 500],
        'contact.phone' => ['max' => 50],
        'contact.email' => ['email' => true, 'max' => 255],
        'mail.from_name' => ['max' => 100],
        'social.facebook' => ['url' => true, 'max' => 500],
        'social.instagram' => ['url' => true, 'max' => 500],
        'site.name' => ['max' => 100],
        'site.tagline' => ['max' => 255],
    ];

    /** Clés exposées publiquement (GET sans auth). Le reste reste admin-only. */
    private const PUBLIC_KEYS = [
        'contact.address',
        'contact.phone',
        'contact.email',
        'social.facebook',
        'social.instagram',
        'site.name',
        'site.tagline',
    ];

    private Setting $setting;

    public function __construct()
    {
        $this->setting = new Setting(afboxing_db());
    }

    public function index(array $params): void
    {
        $grouped = $this->setting->getGrouped();

        if (!$this->isAdminRequest($params)) {
            $grouped = $this->filterPublicGrouped($grouped);
        }

        $this->json($grouped);
    }

    public function show(array $params): void
    {
        $key = (string)($params['key'] ?? '');

        if (!$this->isAdminRequest($params) && !in_array($key, self::PUBLIC_KEYS, true)) {
            $this->json(['error' => 'Paramètre introuvable'], 404);
            return;
        }

        $value = $this->setting->get($key);
        
        if ($value === null) {
            $this->json(['error' => 'Paramètre introuvable'], 404);
            return;
        }
        
        $this->json(['key' => $key, 'value' => $value]);
    }

    public function store(array $params): void
    {
        $data = $params['_body'] ?? [];
        
        if (isset($data['settings']) && is_array($data['settings'])) {
            $settings = [];
            $errors = [];
            foreach ($data['settings'] as $key => $value) {
                $key = (string)$key;
                $err = $this->validateSettingKeyValue($key, is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE) : (string)$value);
                if ($err !== null) {
                    $errors[$key] = $err;
                    continue;
                }
                $category = $this->getCategoryForKey($key);
                $settings[] = [
                    'key' => $key,
                    'value' => is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE) : (string)$value,
                    'category' => $category
                ];
            }

            if (!empty($errors)) {
                $this->json(['errors' => $errors], 422);
                return;
            }
            
            if ($this->setting->bulkUpdate($settings)) {
                $this->logActivity($params, 'update', 'settings', 'Paramètres du site mis à jour');
                $this->json(['message' => 'Paramètres sauvegardés avec succès']);
            } else {
                $this->json(['error' => 'Erreur lors de la sauvegarde'], 500);
            }
        } else {
            $key = (string)($data['key'] ?? '');
            $value = $data['value'] ?? '';
            $category = $data['category'] ?? $this->getCategoryForKey($key);
            
            if ($key === '') {
                $this->json(['error' => 'Clé requise'], 422);
                return;
            }

            $err = $this->validateSettingKeyValue($key, (string)$value);
            if ($err !== null) {
                $this->json(['errors' => [$key => $err]], 422);
                return;
            }
            
            if ($this->setting->set($key, (string)$value, $category)) {
                $this->logActivity($params, 'update', 'settings', 'Paramètre « ' . $key . ' » mis à jour');
                $this->json(['message' => 'Paramètre sauvegardé avec succès']);
            } else {
                $this->json(['error' => 'Erreur lors de la sauvegarde'], 500);
            }
        }
    }

    public function destroy(array $params): void
    {
        $key = $params['key'] ?? '';
        
        if ($this->setting->delete($key)) {
            $this->logActivity($params, 'delete', 'settings', 'Paramètre « ' . $key . ' » supprimé');
            $this->json(['message' => 'Paramètre supprimé avec succès']);
        } else {
            $this->json(['error' => 'Paramètre introuvable'], 404);
        }
    }

    private function validateSettingKeyValue(string $key, string $value): ?string
    {
        if (!isset(self::ALLOWED_KEYS[$key])) {
            return 'Clé de paramètre non autorisée.';
        }
        $rules = self::ALLOWED_KEYS[$key];
        $trimmed = trim($value);

        if (isset($rules['max']) && mb_strlen($trimmed) > (int)$rules['max']) {
            return 'Valeur trop longue (max ' . $rules['max'] . ' caractères).';
        }

        if (!empty($rules['email']) && $trimmed !== '' && !$this->validateEmail($trimmed)) {
            return 'Format d\'email invalide.';
        }

        if (!empty($rules['url']) && $trimmed !== '') {
            if (!preg_match('#^https?://#i', $trimmed)) {
                return 'L\'URL doit commencer par http:// ou https://.';
            }
            if (filter_var($trimmed, FILTER_VALIDATE_URL) === false) {
                return 'URL invalide.';
            }
        }

        return null;
    }

    /**
     * Auth optionnelle : si un JWT admin valide est présent, accès complet.
     * Sinon (visiteur public) : clés PUBLIC_KEYS uniquement.
     */
    private function isAdminRequest(array $params): bool
    {
        $auth = $params['authUser'] ?? null;
        if (is_array($auth) && ($auth['role'] ?? '') === 'admin') {
            return true;
        }

        // GET /api/settings n'a pas de middleware : tenter une auth silencieuse
        if (\AFBoxing\Core\HttpRequest::bearerToken()) {
            $mw = new \AFBoxing\Middlewares\AuthMiddleware(['admin']);
            // Évite d'envoyer une réponse 401 au public : on capture via buffer
            // AuthMiddleware envoie déjà JsonErrorResponse — on ne l'utilise donc
            // que si on peut vérifier sans side-effect. On décode manuellement.
            try {
                $user = $this->tryResolveAdminFromToken();
                return $user !== null;
            } catch (\Throwable) {
                return false;
            }
        }

        return false;
    }

    /** @return array<string,mixed>|null */
    private function tryResolveAdminFromToken(): ?array
    {
        $token = \AFBoxing\Core\HttpRequest::bearerToken();
        if (!$token) {
            return null;
        }

        $secret = $_ENV['JWT_SECRET'] ?? getenv('JWT_SECRET') ?: null;
        if (!$secret && class_exists(\Dotenv\Dotenv::class)) {
            $backendRoot = dirname(__DIR__, 2);
            if (file_exists($backendRoot . '/.env')) {
                \Dotenv\Dotenv::createImmutable($backendRoot)->safeLoad();
            }
            $secret = $_ENV['JWT_SECRET'] ?? getenv('JWT_SECRET') ?: null;
        }
        if (!$secret || strlen((string)$secret) < 32) {
            return null;
        }

        try {
            $decoded = \Firebase\JWT\JWT::decode($token, new \Firebase\JWT\Key($secret, 'HS256'));
            if (!isset($decoded->sub)) {
                return null;
            }
            if (isset($decoded->jti) && is_string($decoded->jti) && $decoded->jti !== '') {
                if ((new \AFBoxing\Core\JwtRevocationList())->isRevoked($decoded->jti)) {
                    return null;
                }
            }
            $pdo = afboxing_db();
            $stmt = $pdo->prepare('SELECT id, username, role FROM users WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $decoded->sub]);
            $user = $stmt->fetch();
            if (!$user || ($user['role'] ?? '') !== 'admin') {
                return null;
            }
            return $user;
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * @param array<string, array<string, mixed>> $grouped
     * @return array<string, array<string, mixed>>
     */
    private function filterPublicGrouped(array $grouped): array
    {
        $out = [];
        foreach ($grouped as $category => $items) {
            if (!is_array($items)) {
                continue;
            }
            foreach ($items as $key => $value) {
                if (in_array((string)$key, self::PUBLIC_KEYS, true)) {
                    $out[$category][$key] = $value;
                }
            }
        }
        return $out;
    }

    private function getCategoryForKey(string $key): string
    {
        if (strpos($key, 'contact.') === 0) return 'contact';
        if (strpos($key, 'mail.') === 0) return 'mail';
        if (strpos($key, 'social.') === 0) return 'social';
        if (strpos($key, 'site.') === 0) return 'site';
        return 'general';
    }
}
