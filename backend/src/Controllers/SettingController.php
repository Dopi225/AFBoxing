<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

use AFBoxing\Models\Setting;

class SettingController extends BaseController
{
    private Setting $setting;

    public function __construct()
    {
        $this->setting = new Setting(afboxing_db());
    }

    public function index(array $params): void
    {
        $grouped = $this->setting->getGrouped();
        $this->json($grouped);
    }

    public function show(array $params): void
    {
        $key = $params['key'] ?? '';
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
            // Bulk update
            $settings = [];
            foreach ($data['settings'] as $key => $value) {
                $category = $this->getCategoryForKey($key);
                $settings[] = [
                    'key' => $key,
                    'value' => is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE) : (string)$value,
                    'category' => $category
                ];
            }
            
            if ($this->setting->bulkUpdate($settings)) {
                $this->json(['message' => 'Paramètres sauvegardés avec succès']);
            } else {
                $this->json(['error' => 'Erreur lors de la sauvegarde'], 500);
            }
        } else {
            // Single update
            $key = $data['key'] ?? '';
            $value = $data['value'] ?? '';
            $category = $data['category'] ?? 'general';
            
            if (empty($key)) {
                $this->json(['error' => 'Clé requise'], 422);
                return;
            }
            
            if ($this->setting->set($key, (string)$value, $category)) {
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
            $this->json(['message' => 'Paramètre supprimé avec succès']);
        } else {
            $this->json(['error' => 'Paramètre introuvable'], 404);
        }
    }

    private function getCategoryForKey(string $key): string
    {
        if (strpos($key, 'contact.') === 0) return 'contact';
        if (strpos($key, 'social.') === 0) return 'social';
        if (strpos($key, 'site.') === 0) return 'site';
        return 'general';
    }
}

