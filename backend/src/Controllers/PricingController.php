<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

use AFBoxing\Models\Pricing;
use Respect\Validation\Validator as v;

class PricingController extends BaseController
{
    private Pricing $pricing;

    public function __construct()
    {
        $this->pricing = new Pricing(afboxing_db());
    }

    public function index(array $params): void
    {
        $grouped = $this->pricing->getGrouped(); 
        $this->json($grouped);
    }

    public function show(array $params): void
    {
        $key = $params['key'] ?? '';
        $item = $this->pricing->findByKey($key);
        
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

            try {
                $item = $this->pricing->create($data);
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

        try {
            $item = $this->pricing->update($key, $data);
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

