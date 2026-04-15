<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

use AFBoxing\Models\Activity;
use AFBoxing\Models\Pricing;
use Respect\Validation\Validator as v;

class PricingController extends BaseController
{
    private Pricing $pricing;

    private Activity $activity;

    public function __construct()
    {
        $this->pricing = new Pricing(afboxing_db());
        $this->activity = new Activity(afboxing_db());
    }

    /** Liste complète (admin) avec activité liée — administrateur. */
    public function adminList(array $params): void
    {
        $rows = $this->pricing->listDetailedForAdmin();
        $out = array_map(static function (array $r): array {
            return [
                'priceKey' => $r['price_key'],
                'label' => $r['label'],
                'category' => $r['category'],
                'amount' => isset($r['amount']) ? (float)$r['amount'] : 0.0,
                'period' => $r['period'] ?? 'an',
                'note' => $r['note'] ?? null,
                'enabled' => (bool)($r['enabled'] ?? 1),
                'activityId' => !empty($r['activity_id']) ? (string)$r['activity_id'] : null,
                'activityTitle' => $r['activity_title'] ?? null,
            ];
        }, $rows);
        $this->json($out);
    }

    private function validateActivityIdForPricing(?string $activityId): ?string
    {
        if ($activityId === null || $activityId === '') {
            return null;
        }
        $a = $this->activity->find($activityId);
        if (!$a) {
            return 'Activité introuvable.';
        }
        if (empty($a['enabled'])) {
            return 'L’activité doit être activée pour être liée à un tarif.';
        }

        return null;
    }

    public function index(array $params): void
    {
        $grouped = $this->pricing->getGrouped(); 
        $this->json($grouped);
    }

    /** Catalogue tarifs (clés + libellés) pour formulaires activités — staff authentifié. */
    public function catalog(array $params): void
    {
        $rows = $this->pricing->catalogForAdmin();
        $out = array_map(static function (array $r): array {
            return [
                'priceKey' => $r['price_key'],
                'label' => $r['label'],
                'category' => $r['category'],
                'amount' => isset($r['amount']) ? (float)$r['amount'] : 0.0,
                'period' => $r['period'] ?? 'an',
                'note' => $r['note'] ?? null,
                'enabled' => (bool)($r['enabled'] ?? 1),
                'activityId' => !empty($r['activity_id']) ? (string)$r['activity_id'] : null,
            ];
        }, $rows);
        $this->json($out);
    }

    public function show(array $params): void
    {
        $key = $params['key'] ?? '';
        $item = $this->pricing->findByKeyPublic($key);
        
        if (!$item) {
            $this->json(['error' => 'Tarif introuvable'], 404);
            return;
        }
        
        // Formater pour correspondre au format frontend
        $formatted = [
            'label' => $item['label'],
            'amount' => (float)$item['amount'],
            'period' => $item['period'],
            'note' => $item['note']
        ];
        
        $this->json($formatted);
    }

    public function store(array $params): void
    {
        $data = $params['_body'] ?? [];
        
        if (isset($data['pricings']) && is_array($data['pricings'])) {
            // Bulk update
            $errors = [];
            foreach ($data['pricings'] as $pricing) {
                $required = ['price_key', 'label', 'amount'];
                $missing = $this->validateRequired($pricing, $required);
                if (!empty($missing)) {
                    $errors[] = $missing;
                }
            }
            
            if (!empty($errors)) {
                $this->json(['errors' => $errors], 422);
                return;
            }
            
            if ($this->pricing->bulkUpdate($data['pricings'])) {
                $this->json(['message' => 'Tarifs sauvegardés avec succès']);
            } else {
                $this->json(['error' => 'Erreur lors de la sauvegarde'], 500);
            }
        } else {
            // Single create
            $errors = $this->validateRequired($data, ['price_key', 'label', 'amount']);
            
            if (!empty($errors)) {
                $this->json(['errors' => $errors], 422);
                return;
            }

            // Validation supplémentaire
            if (empty($errors['price_key']) && isset($data['price_key'])) {
                if (!$this->validateLength($data['price_key'], 1, 100)) {
                    $errors['price_key'] = 'La clé doit contenir entre 1 et 100 caractères.';
                }
            }
            
            if (empty($errors['label']) && isset($data['label'])) {
                if (!$this->validateLength($data['label'], 1, 255)) {
                    $errors['label'] = 'Le libellé doit contenir entre 1 et 255 caractères.';
                }
            }
            
            if (empty($errors['amount']) && isset($data['amount'])) {
                if (!is_numeric($data['amount']) || (float)$data['amount'] < 0) {
                    $errors['amount'] = 'Le montant doit être un nombre positif.';
                }
            }
            
            if (!empty($errors)) {
                $this->json(['errors' => $errors], 422);
                return;
            }

            $aid = $data['activity_id'] ?? $data['activityId'] ?? null;
            $actErr = $this->validateActivityIdForPricing(is_string($aid) ? trim($aid) ?: null : null);
            if ($actErr !== null) {
                $this->json(['errors' => ['activityId' => $actErr]], 422);
                return;
            }

            try {
                $payload = [
                    'price_key' => $data['price_key'],
                    'label' => $data['label'],
                    'amount' => $data['amount'],
                    'period' => $data['period'] ?? 'an',
                    'note' => $data['note'] ?? null,
                    'category' => $data['category'] ?? 'boxing',
                    'enabled' => $data['enabled'] ?? 1,
                    'activity_id' => is_string($aid) && trim($aid) !== '' ? trim($aid) : null,
                ];
                $item = $this->pricing->create($payload);
                $this->json($item, 201);
            } catch (\Exception $e) {
                $this->json(['error' => 'Erreur lors de la création du tarif'], 500);
            }
        }
    }

    public function update(array $params): void
    {
        $key = $params['key'] ?? '';
        $data = $params['_body'] ?? [];
        
        $existing = $this->pricing->findByKey($key);
        if (!$existing) {
            $this->json(['error' => 'Tarif introuvable'], 404);
            return;
        }

        $errors = $this->validateRequired($data, ['label', 'amount']);
        
        if (!empty($errors)) {
            $this->json(['errors' => $errors], 422);
            return;
        }

        $aid = $data['activity_id'] ?? $data['activityId'] ?? null;
        if (array_key_exists('activity_id', $data) || array_key_exists('activityId', $data)) {
            $actErr = $this->validateActivityIdForPricing(is_string($aid) ? trim($aid) ?: null : null);
            if ($actErr !== null) {
                $this->json(['errors' => ['activityId' => $actErr]], 422);
                return;
            }
        }

        try {
            $payload = [
                'label' => $data['label'],
                'amount' => $data['amount'],
                'period' => $data['period'] ?? 'an',
                'note' => $data['note'] ?? null,
                'category' => $data['category'] ?? 'boxing',
                'enabled' => $data['enabled'] ?? 1,
            ];
            if (array_key_exists('activity_id', $data) || array_key_exists('activityId', $data)) {
                $payload['activity_id'] = is_string($aid) && trim($aid) !== '' ? trim($aid) : null;
            }
            $item = $this->pricing->update($key, $payload);
            $this->json($item);
        } catch (\Exception $e) {
            $this->json(['error' => 'Erreur lors de la modification du tarif'], 500);
        }
    }

    public function destroy(array $params): void
    {
        $key = $params['key'] ?? '';
        
        if (!$this->pricing->findByKey($key)) {
            $this->json(['error' => 'Tarif introuvable'], 404);
            return;
        }

        if ($this->pricing->delete($key)) {
            $this->json(['message' => 'Tarif supprimé avec succès']);
        } else {
            $this->json(['error' => 'Erreur lors de la suppression'], 500);
        }
    }
}

