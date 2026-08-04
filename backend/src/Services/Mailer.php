<?php

declare(strict_types=1);

namespace AFBoxing\Services;

use PHPMailer\PHPMailer\Exception as PhpMailerException;
use PHPMailer\PHPMailer\PHPMailer;

/**
 * Envoi d'emails via SMTP (PHPMailer).
 * Configuration : variables MAIL_* dans .env
 */
final class Mailer
{
    /**
     * @throws MailSendException
     */
    public function send(
        string $toEmail,
        string $toName,
        string $subject,
        string $bodyText,
        string $fromEmail,
        string $fromName
    ): void {
        $enabled = (string)($_ENV['MAIL_ENABLED'] ?? getenv('MAIL_ENABLED') ?: '1');
        $host = trim((string)($_ENV['MAIL_HOST'] ?? getenv('MAIL_HOST') ?: ''));

        if ($enabled === '0' || $enabled === 'false' || $host === '') {
            throw new MailSendException(
                'L\'envoi d\'email n\'est pas encore configuré. Contactez la personne qui gère le site.'
            );
        }

        if (!filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
            throw new MailSendException(
                'L\'adresse email du contact n\'est pas valide. Vérifiez-la ou demandez au contact de vous réécrire.'
            );
        }

        if (!filter_var($fromEmail, FILTER_VALIDATE_EMAIL)) {
            throw new MailSendException(
                'L\'adresse email du club (Paramètres) n\'est pas valide. Corrigez-la puis réessayez.'
            );
        }

        $port = (int)($_ENV['MAIL_PORT'] ?? getenv('MAIL_PORT') ?: 587);
        $username = (string)($_ENV['MAIL_USERNAME'] ?? getenv('MAIL_USERNAME') ?: '');
        $password = (string)($_ENV['MAIL_PASSWORD'] ?? getenv('MAIL_PASSWORD') ?: '');
        $encryption = strtolower(trim((string)($_ENV['MAIL_ENCRYPTION'] ?? getenv('MAIL_ENCRYPTION') ?: 'tls')));

        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->Host = $host;
            $mail->Port = $port > 0 ? $port : 587;
            $mail->SMTPAuth = $username !== '';
            if ($mail->SMTPAuth) {
                $mail->Username = $username;
                $mail->Password = $password;
            }

            if ($encryption === 'ssl') {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            } elseif ($encryption === 'tls') {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            } else {
                $mail->SMTPSecure = false;
                $mail->SMTPAutoTLS = false;
            }

            $mail->CharSet = 'UTF-8';
            $mail->setFrom($fromEmail, $fromName !== '' ? $fromName : $fromEmail);
            $mail->addReplyTo($fromEmail, $fromName !== '' ? $fromName : $fromEmail);
            $mail->addAddress($toEmail, $toName !== '' ? $toName : $toEmail);
            $mail->Subject = $subject;
            $mail->Body = $bodyText;
            $mail->isHTML(false);

            $mail->send();
        } catch (PhpMailerException $e) {
            error_log('[afboxing] mail send failed: ' . $e->getMessage());
            throw new MailSendException(
                'L\'email n\'a pas pu être envoyé. Vérifiez l\'adresse du contact ou réessayez plus tard.'
            );
        } catch (\Throwable $e) {
            error_log('[afboxing] mail unexpected: ' . $e->getMessage());
            throw new MailSendException(
                'L\'email n\'a pas pu être envoyé. Vérifiez l\'adresse du contact ou réessayez plus tard.'
            );
        }
    }
}
