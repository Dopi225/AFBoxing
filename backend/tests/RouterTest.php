<?php

declare(strict_types=1);

namespace AFBoxing\Tests;

use AFBoxing\Controllers\BaseController;
use AFBoxing\Core\Router;
use PHPUnit\Framework\TestCase;

final class RouterTest extends TestCase
{
    public function testDispatchesMatchingGetRoute(): void
    {
        $router = new Router();
        $router->get('/api/ping', [PingController::class, 'ping']);

        ob_start();
        $router->dispatch('GET', '/api/ping');
        $out = ob_get_clean();

        self::assertStringContainsString('"ok":true', $out);
    }

    public function testReturns404ForUnknownPath(): void
    {
        $router = new Router();
        $router->get('/api/ping', [PingController::class, 'ping']);

        ob_start();
        $router->dispatch('GET', '/api/nope');
        $out = ob_get_clean();

        self::assertStringContainsString('"code":"NOT_FOUND"', $out);
        self::assertSame(404, http_response_code());
    }
}

/** @internal */
final class PingController extends BaseController
{
    public function ping(array $params): void
    {
        $this->json(['ok' => true]);
    }
}
