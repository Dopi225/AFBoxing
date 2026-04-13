<?php

declare(strict_types=1);

namespace AFBoxing\Tests;

use AFBoxing\Core\HttpRequest;
use PHPUnit\Framework\TestCase;

final class HttpRequestTest extends TestCase
{
    protected function tearDown(): void
    {
        unset(
            $_SERVER['REMOTE_ADDR'],
            $_SERVER['HTTP_X_FORWARDED_FOR'],
            $_SERVER['HTTP_X_REAL_IP'],
            $_ENV['TRUSTED_PROXY'],
        );
        putenv('TRUSTED_PROXY');
        parent::tearDown();
    }

    public function testClientIpUsesRemoteAddrByDefault(): void
    {
        $_SERVER['REMOTE_ADDR'] = '192.168.1.10';
        self::assertSame('192.168.1.10', HttpRequest::clientIp());
    }

    public function testClientIpUsesXForwardedForWhenTrustedProxy(): void
    {
        $_ENV['TRUSTED_PROXY'] = '1';
        $_SERVER['REMOTE_ADDR'] = '10.0.0.1';
        $_SERVER['HTTP_X_FORWARDED_FOR'] = '203.0.113.5, 10.0.0.1';

        self::assertSame('203.0.113.5', HttpRequest::clientIp());
    }
}
