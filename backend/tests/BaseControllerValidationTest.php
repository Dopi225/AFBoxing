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
    }
}
