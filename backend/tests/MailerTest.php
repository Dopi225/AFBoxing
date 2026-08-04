<?php

declare(strict_types=1);

namespace AFBoxing\Tests;

use AFBoxing\Services\Mailer;
use AFBoxing\Services\MailSendException;
use PHPUnit\Framework\TestCase;

final class MailerTest extends TestCase
{
    private string $logFile;

    protected function setUp(): void
    {
        $this->logFile = dirname(__DIR__) . '/storage/logs/mail.log';
        if (is_file($this->logFile)) {
            @unlink($this->logFile);
        }
        $_ENV['MAIL_DRIVER'] = 'log';
        putenv('MAIL_DRIVER=log');
        parent::setUp();
    }

    protected function tearDown(): void
    {
        unset($_ENV['MAIL_DRIVER']);
        putenv('MAIL_DRIVER');
        if (is_file($this->logFile)) {
            @unlink($this->logFile);
        }
        parent::tearDown();
    }

    public function testLogDriverWritesWithoutSmtp(): void
    {
        $mailer = new Mailer();
        $mailer->send(
            'contact@example.com',
            'Contact',
            'Sujet test',
            'Corps du message de test.',
            'club@example.com',
            'AF Boxing'
        );

        self::assertFileExists($this->logFile);
        $contents = (string) file_get_contents($this->logFile);
        self::assertStringContainsString('contact@example.com', $contents);
        self::assertStringContainsString('Sujet test', $contents);
    }

    public function testLogDriverRejectsInvalidToEmail(): void
    {
        $mailer = new Mailer();
        $this->expectException(MailSendException::class);
        $mailer->send(
            'pas-un-email',
            'Contact',
            'Sujet',
            'Corps',
            'club@example.com',
            'Club'
        );
    }

    public function testDisabledSmtpWithoutHostThrows(): void
    {
        $_ENV['MAIL_DRIVER'] = 'smtp';
        putenv('MAIL_DRIVER=smtp');
        $_ENV['MAIL_ENABLED'] = '0';
        putenv('MAIL_ENABLED=0');
        $_ENV['MAIL_HOST'] = '';
        putenv('MAIL_HOST=');

        $mailer = new Mailer();
        $this->expectException(MailSendException::class);
        try {
            $mailer->send(
                'contact@example.com',
                'Contact',
                'Sujet',
                'Corps',
                'club@example.com',
                'Club'
            );
        } finally {
            unset($_ENV['MAIL_ENABLED'], $_ENV['MAIL_HOST']);
            putenv('MAIL_ENABLED');
            putenv('MAIL_HOST');
        }
    }
}
