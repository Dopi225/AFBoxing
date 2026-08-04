<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

use AFBoxing\Models\Activity;
use AFBoxing\Models\Pricing;

class PricingController extends BaseController
{
    use TrashActions;
    use LogsActivity;

    private Pricing $pricing;

    private Activity $activity;

    public function __construct()
    {
        $this->pricing = new Pricing(afboxing_db());
        $this->activity = new Activity(afboxing_db());
    }

    private function resolveSeasonId(array $params, array $data = []): ?int
    {
        $fromQuery = $params['seasonId'] ?? $params['season_id'] ?? null;
        if ($fromQuery !== null && $fromQuery !== '') {
            return (int)$fromQuery;
        }
        $fromBody = $data['seasonId'] ?? $data['season_id'] ?? null;
        if ($fromBody !== null && $fromBody !== '') {
            return (int)$fromBody;
        }
        // Aussi depuis query string brute
        if (isset($_GET['seasonId']) && $_GET['seasonId'] !== '') {
            return (int)$_GET['seasonId'];
        }
        return $this->pricing->currentSeasonId();
    }

    /** Liste complète (admin) avec activité liée — administrateur. */
    public function adminList(array $params): void
    {
        $seasonId = $this->resolveSeasonId($params);
        $rows = $this->pricing->listDetailedForAdmin($seasonId);
        $out = array_map(static function (array $r): array {
            return [
                'id' => (int)$r['id'],
                'seasonId' => (int)$r['season_id'],
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
        $this->json($this->pricing->getGroupedWithSeason());
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
                'seasonId' => isset($r['season_id']) ? (int)$r['season_id'] : null,
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

        $formatted = [
            'label' => $item['label'],
            'amount' => (float)$item['amount'],
            'period' => $item['period'],
            'note' => $item['note'],
        ];

        $this->json($formatted);
    }

    public function store(array $params): void
    {
        $data = $params['_body'] ?? [];
        $seasonId = $this->resolveSeasonId($params, $data);

        if (isset($data['pricings']) && is_array($data['pricings'])) {
            if ($seasonId === null || $seasonId < 1) {
                $this->json(['errors' => ['seasonId' => 'Choisissez une saison pour la mise à jour en masse.']], 422);
                return;
            }

            $errors = [];
            $seenKeys = [];
            $seenActivities = [];
            foreach ($data['pricings'] as $index => $pricing) {
                if (!is_array($pricing)) {
                    $errors["item_{$index}"] = ['pricing' => 'Entrée invalide.'];
                    continue;
                }
                $required = ['price_key', 'label', 'amount'];
                $missing = $this->validateRequired($pricing, $required);
                if (empty($missing['amount']) && isset($pricing['amount'])) {
                    if (!is_numeric($pricing['amount']) || (float)$pricing['amount'] < 0) {
                        $missing['amount'] = 'Le montant doit être un nombre positif.';
                    }
                }
                $pk = isset($pricing['price_key']) ? trim((string)$pricing['price_key']) : '';
                if ($pk !== '') {
                    if (isset($seenKeys[$pk])) {
                        $missing['price_key'] = 'Clé en double dans le lot.';
                    }
                    $seenKeys[$pk] = true;
                }
                $aid = $pricing['activity_id'] ?? $pricing['activityId'] ?? null;
                $aidNorm = is_string($aid) ? trim($aid) : '';
                if ($aidNorm !== '') {
                    $actErr = $this->validateActivityIdForPricing($aidNorm);
                    if ($actErr !== null) {
                        $missing['activityId'] = $actErr;
                    } elseif (isset($seenActivities[$aidNorm])) {
                        $missing['activityId'] = 'Une même activité ne peut être liée qu\'à un seul tarif dans le lot.';
                    } else {
                        $seenActivities[$aidNorm] = true;
                    }
                }
                if (!empty($missing)) {
                    $errors["item_{$index}"] = $missing;
                }
            }

            if (!empty($errors)) {
                $this->json(['errors' => $errors], 422);
                return;
            }

            try {
                if ($this->pricing->bulkUpdate($data['pricings'], $seasonId)) {
                    $this->logActivity($params, 'update', 'pricing', 'Tarifs mis à jour en masse (' . count($data['pricings']) . ')');
                    $this->json(['message' => 'Tarifs sauvegardés avec succès']);
                } else {
                    $this->json(['error' => 'Erreur lors de la sauvegarde'], 500);
                }
            } catch (\InvalidArgumentException $e) {
                $this->json(['error' => $e->getMessage()], 422);
            } catch (\Throwable $e) {
                error_log('[afboxing] pricing bulk: ' . $e->getMessage());
                $this->json(['error' => 'Erreur lors de la sauvegarde en masse'], 500);
            }
        } else {
            $errors = $this->validateRequired($data, ['price_key', 'label', 'amount']);

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

            if ($seasonId === null || $seasonId < 1) {
                $errors['seasonId'] = 'Choisissez une saison pour ce tarif.';
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
                    'season_id' => $seasonId,
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
                $this->logActivity($params, 'create', 'pricing', 'Tarif « ' . ($payload['label'] ?? $payload['price_key']) . ' » créé');
                $this->json($item, 201);
            } catch (\Exception $e) {
                error_log('[afboxing] pricing create: ' . $e->getMessage());
                $this->json(['error' => 'Erreur lors de la création du tarif'], 500);
            }
        }
    }

    public function update(array $params): void
    {
        $key = $params['key'] ?? '';
        $data = $params['_body'] ?? [];
        $seasonId = $this->resolveSeasonId($params, $data);

        $existing = $this->pricing->findByKey($key, $seasonId);
        if (!$existing) {
            $this->json(['error' => 'Tarif introuvable'], 404);
            return;
        }

        $errors = $this->validateRequired($data, ['label', 'amount']);

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
                'seasonId' => $seasonId,
            ];
            if (array_key_exists('activity_id', $data) || array_key_exists('activityId', $data)) {
                $payload['activity_id'] = is_string($aid) && trim($aid) !== '' ? trim($aid) : null;
            }
            $item = $this->pricing->update($key, $payload, $seasonId);
            $this->logActivity($params, 'update', 'pricing', 'Tarif « ' . ($payload['label'] ?? $key) . ' » modifié');
            $this->json($item);
        } catch (\Exception $e) {
            error_log('[afboxing] pricing update: ' . $e->getMessage());
            $this->json(['error' => 'Erreur lors de la modification du tarif'], 500);
        }
    }

    public function destroy(array $params): void
    {
        $key = $params['key'] ?? '';
        $seasonId = $this->resolveSeasonId($params, $params['_body'] ?? []);

        if (!$this->pricing->findByKey($key, $seasonId)) {
            $this->json(['error' => 'Tarif introuvable'], 404);
            return;
        }

        if ($this->pricing->delete($key, $seasonId)) {
            $this->logActivity($params, 'delete', 'pricing', 'Tarif déplacé en corbeille : ' . $key);
            $this->json(['message' => 'Tarif déplacé en corbeille (30 jours).']);
        } else {
            $this->json(['error' => 'Erreur lors de la suppression'], 500);
        }
    }

    public function trash(array $params): void
    {
        $seasonId = $this->resolveSeasonId($params);
        $rows = $this->pricing->trash($seasonId);
        $out = array_map(static function (array $r): array {
            return [
                'id' => (int)$r['id'],
                'seasonId' => (int)$r['season_id'],
                'priceKey' => $r['price_key'],
                'price_key' => $r['price_key'],
                'label' => $r['label'],
                'deleted_at' => $r['deleted_at'] ?? null,
            ];
        }, $rows);
        $this->json($out);
    }

    public function restore(array $params): void
    {
        $key = $params['key'] ?? '';
        $seasonId = $this->resolveSeasonId($params, $params['_body'] ?? []);

        // La corbeille UI passe l'id numérique dans l'URL (/api/pricing/{id}/restore)
        if (ctype_digit((string)$key)) {
            $id = (int)$key;
            if ($this->pricing->restoreById($id)) {
                $item = $this->pricing->findById($id);
                $this->json(['message' => 'Élément restauré.', 'item' => $item]);
                return;
            }
        }

        if (isset($_GET['id']) || isset(($params['_body'] ?? [])['id'])) {
            $id = (int)($_GET['id'] ?? ($params['_body']['id'] ?? 0));
            if ($id > 0 && $this->pricing->restoreById($id)) {
                $item = $this->pricing->findById($id);
                $this->json(['message' => 'Élément restauré.', 'item' => $item]);
                return;
            }
        }

        if ($this->pricing->restore($key, $seasonId)) {
            $item = $this->pricing->findByKey($key, $seasonId);
            $this->json(['message' => 'Élément restauré.', 'item' => $item]);
            return;
        }

        $this->jsonError('NOT_FOUND', 'Élément introuvable dans la corbeille.', 404);
    }
}
