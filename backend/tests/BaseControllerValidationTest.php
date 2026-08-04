<?php

declare(strict_types=1);

namespace AFBoxing\Tests;

use AFBoxing\Controllers\BaseController;
use PHPUnit\Framework\TestCase;

final class BaseControllerValidationTest extends TestCase
{
    public function testValidateDateAcceptsIso(): void
    {
        $c = new class () extends BaseController {
            public function check(string $d): bool
            {
                return $this->validateDate($d);
            }
        };

        self::assertTrue($c->check('2026-04-13'));
        self::assertFalse($c->check('13-04-2026'));
        self::assertFalse($c->check('invalid'));
    }

    public function testValidateLengthBounds(): void
    {
        $c = new class () extends BaseController {
            public function check(string $s, int $min, int $max): bool
            {
                return $this->validateLength($s, $min, $max);
            }
        };

        self::assertTrue($c->check('ab', 2, 10));
        self::assertFalse($c->check('a', 2, 10));
        self::assertFalse($c->check(str_repeat('x', 11), 2, 10));
    }

    public function testValidateRequiredRejectsEmptyFields(): void
    {
        $c = new class () extends BaseController {
            public function check(array $data, array $fields): array
            {
                return $this->validateRequired($data, $fields);
            }
        };

        $errors = $c->check(
            ['name' => '', 'email' => 'a@b.c', 'message' => null],
            ['name', 'email', 'message']
        );

        self::assertArrayHasKey('name', $errors);
        self::assertArrayHasKey('message', $errors);
        self::assertArrayNotHasKey('email', $errors);
        self::assertSame('Ce champ est obligatoire.', $errors['name']);
    }

    public function testValidateEmailRejectsInvalid(): void
    {
        $c = new class () extends BaseController {
            public function check(string $email): bool
            {
                return $this->validateEmail($email);
            }
        };

        self::assertTrue($c->check('contact@afboxingclub86.com'));
        self::assertFalse($c->check('pas-un-email'));
        self::assertFalse($c->check('a@'));
        self::assertFalse($c->check(''));
    }

    public function testSanitizePlainTextStripsTags(): void
    {
        $c = new class () extends BaseController {
            public function clean(string $v): string
            {
                return $this->sanitizePlainText($v, 100);
            }
        };

        // strip_tags retire les balises mais conserve le texte intérieur
        self::assertSame('alert(1)Bonjour', $c->clean('<script>alert(1)</script>Bonjour'));
        self::assertSame('Hello', $c->clean('  Hello  '));
        self::assertSame('Safe', $c->clean('<b>Safe</b>'));
    }

    public function testSeasonLikeDateOrderValidationPattern(): void
    {
        $c = new class () extends BaseController {
            public function endsAfterStart(string $start, string $end): bool
            {
                if (!$this->validateDate($start) || !$this->validateDate($end)) {
                    return false;
                }
                return $end >= $start;
            }
        };

        self::assertTrue($c->endsAfterStart('2026-09-01', '2027-08-31'));
        self::assertFalse($c->endsAfterStart('2027-09-01', '2026-08-31'));
        self::assertFalse($c->endsAfterStart('bad', '2026-08-31'));
    }

    public function testReplyBodyLengthRule(): void
    {
        $c = new class () extends BaseController {
            public function ok(string $body): bool
            {
                return $this->validateLength($body, 10, 5000);
            }
        };

        self::assertFalse($c->ok('court'));
        self::assertTrue($c->ok('Réponse assez longue pour passer.'));
    }
}
