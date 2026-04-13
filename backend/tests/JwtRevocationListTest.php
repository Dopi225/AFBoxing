<?php

declare(strict_types=1);

namespace AFBoxing\Tests;

use AFBoxing\Core\JwtRevocationList;
use PHPUnit\Framework\TestCase;

final class JwtRevocationListTest extends TestCase
{
    private string $tmpDir;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tmpDir = sys_get_temp_dir() . '/afboxing_jwt_' . bin2hex(random_bytes(8));
        mkdir($this->tmpDir, 0777, true);
    }

    protected function tearDown(): void
    {
        $files = glob($this->tmpDir . '/*.rev') ?: [];
        foreach ($files as $f) {
            @unlink($f);
        }
        @rmdir($this->tmpDir);
        parent::tearDown();
    }

    public function testRevokeAndCheck(): void
    {
        $list = new JwtRevocationList($this->tmpDir);
        $jti = 'test-jti-' . bin2hex(random_bytes(8));
        self::assertFalse($list->isRevoked($jti));

        $list->revoke($jti, time() + 3600);
        self::assertTrue($list->isRevoked($jti));
    }
}
