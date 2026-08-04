<?php

declare(strict_types=1);

namespace AFBoxing\Models;

use AFBoxing\Core\SoftDelete;
use PDO;

class Season
{
    public function __construct(private PDO $pdo)
    {
    }

    public function all(): array
    {
        $stmt = $this->pdo->query(
            'SELECT * FROM seasons ORDER BY is_current DESC, starts_on DESC, id DESC'
        );
        return array_map([$this, 'formatSeason'], $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function find(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM seasons WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? $this->formatSeason($row) : null;
    }

    public function findCurrent(): ?array
    {
        $stmt = $this->pdo->query('SELECT * FROM seasons WHERE is_current = 1 ORDER BY id ASC LIMIT 1');
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? $this->formatSeason($row) : null;
    }

    /**
     * Crée une saison et duplique les tarifs d'une saison source.
     *
     * @return array{season: array, copiedCount: int}
     */
    public function createWithCopy(
        string $label,
        string $startsOn,
        string $endsOn,
        int $copyFromSeasonId
    ): array {
        $source = $this->find($copyFromSeasonId);
        if (!$source) {
            throw new \InvalidArgumentException('Saison source introuvable.');
        }

        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare(
                'INSERT INTO seasons (label, starts_on, ends_on, is_current)
                 VALUES (:label, :starts_on, :ends_on, 0)'
            );
            $stmt->execute([
                'label' => $label,
                'starts_on' => $startsOn,
                'ends_on' => $endsOn,
            ]);
            $newId = (int)$this->pdo->lastInsertId();

            $nd = SoftDelete::notDeletedClause();
            $copy = $this->pdo->prepare(
                "INSERT INTO pricing
                  (season_id, price_key, label, amount, period, note, category, enabled, activity_id)
                 SELECT :new_season, price_key, label, amount, period, note, category, enabled, activity_id
                 FROM pricing
                 WHERE season_id = :source_season AND {$nd}"
            );
            $copy->execute([
                'new_season' => $newId,
                'source_season' => $copyFromSeasonId,
            ]);
            $copiedCount = $copy->rowCount();

            $this->pdo->commit();

            return [
                'season' => $this->find($newId) ?? [],
                'copiedCount' => $copiedCount,
            ];
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function update(int $id, array $data): ?array
    {
        if (!$this->find($id)) {
            return null;
        }

        $stmt = $this->pdo->prepare(
            'UPDATE seasons SET
                label = :label,
                starts_on = :starts_on,
                ends_on = :ends_on
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $id,
            'label' => $data['label'],
            'starts_on' => $data['startsOn'],
            'ends_on' => $data['endsOn'],
        ]);

        return $this->find($id);
    }

    /**
     * Définit la saison courante et resynchronise activities.meta_price_key.
     *
     * @return array{season: array, previous: ?array}
     */
    public function setCurrent(int $id): array
    {
        $target = $this->find($id);
        if (!$target) {
            throw new \InvalidArgumentException('Saison introuvable.');
        }

        $previous = $this->findCurrent();

        $this->pdo->beginTransaction();
        try {
            $this->pdo->exec('UPDATE seasons SET is_current = 0');
            $upd = $this->pdo->prepare('UPDATE seasons SET is_current = 1 WHERE id = :id');
            $upd->execute(['id' => $id]);

            // Resync liens activité → tarif de la nouvelle saison courante
            $this->pdo->exec('UPDATE activities SET meta_price_key = NULL');
            $nd = SoftDelete::notDeletedClause('p');
            $sync = $this->pdo->prepare(
                "UPDATE activities a
                 INNER JOIN pricing p ON p.activity_id = a.id AND p.season_id = :sid AND p.enabled = 1 AND {$nd}
                 SET a.meta_price_key = p.price_key"
            );
            $sync->execute(['sid' => $id]);

            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }

        return [
            'season' => $this->find($id) ?? [],
            'previous' => $previous,
        ];
    }

    private function formatSeason(array $row): array
    {
        return [
            'id' => (int)$row['id'],
            'label' => $row['label'],
            'startsOn' => $row['starts_on'],
            'endsOn' => $row['ends_on'],
            'isCurrent' => (bool)$row['is_current'],
            'createdAt' => $row['created_at'] ?? null,
            'updatedAt' => $row['updated_at'] ?? null,
        ];
    }
}
