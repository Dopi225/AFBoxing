<?php

declare(strict_types=1);

namespace AFBoxing\Tests;

use AFBoxing\Core\RateLimiter;
use PHPUnit\Framework\TestCase;

final class RateLimiterTest extends TestCase
{
    private string $tmpDir;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tmpDir = sys_get_temp_dir() . '/afboxing_rl_' . bin2hex(random_bytes(8));
        mkdir($this->tmpDir, 0777, true);
    }

    protected function tearDown(): void
    {
        $files = glob($this->tmpDir . '/*.json') ?: [];
        foreach ($files as $f) {
            @unlink($f);
        }
        @rmdir($this->tmpDir);
        parent::tearDown();
    }

    public function testAllowsWithinLimit(): void
    {
        $rl = new RateLimiter($this->tmpDir);
        $key = 'test_key_' . bin2hex(random_bytes(4));

        self::assertTrue($rl->isAllowed($key, 3, 300));
        self::assertTrue($rl->isAllowed($key, 3, 300));
        self::assertTrue($rl->isAllowed($key, 3, 300));
        self::assertFalse($rl->isAllowed($key, 3, 300));
    }

    public function testResetClearsKey(): void
    {
        $rl = new RateLimiter($this->tmpDir);
        $key = 'reset_key_' . bin2hex(random_bytes(4));

        $rl->isAllowed($key, 2, 300);
        $rl->isAllowed($key, 2, 300);
        self::assertFalse($rl->isAllowed($key, 2, 300));

        $rl->reset($key);
        self::assertTrue($rl->isAllowed($key, 2, 300));
    }

    public function testGetRemainingAttempts(): void
    {
        $rl = new RateLimiter($this->tmpDir);
        $key = 'remain_' . bin2hex(random_bytes(4));

        self::assertSame(5, $rl->getRemainingAttempts($key, 5, 300));
        $rl->isAllowed($key, 5, 300);
        self::assertSame(4, $rl->getRemainingAttempts($key, 5, 300));
    }

    public function testGetRetryAfterSecondsWhenLimited(): void
    {
        $rl = new RateLimiter($this->tmpDir);
        $key = 'retry_' . bin2hex(random_bytes(4));

        $rl->isAllowed($key, 2, 300);
        $rl->isAllowed($key, 2, 300);
        self::assertFalse($rl->isAllowed($key, 2, 300));
        self::assertGreaterThan(0, $rl->getRetryAfterSeconds($key, 2, 300));
    }
}
