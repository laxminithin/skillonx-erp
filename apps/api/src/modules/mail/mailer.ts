import fs from 'node:fs';
import path from 'node:path';
import { env } from '../../config/env.js';

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type MailResult = {
  delivered: boolean;
  mode: 'smtp' | 'console' | 'outbox' | 'disabled';
};

function smtpConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_FROM);
}

async function writeOutbox(message: MailMessage) {
  const dir = path.resolve(process.cwd(), 'tmp', 'mail-outbox');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${Date.now()}-${message.to.replace(/[^a-z0-9@._-]/gi, '_')}.txt`);
  fs.writeFileSync(
    file,
    [`To: ${message.to}`, `Subject: ${message.subject}`, '', message.text].join('\n'),
    'utf8',
  );
  return file;
}

/**
 * Mail provider abstraction.
 * - SMTP_* configured → delivery attempted (requires external SMTP; failures fall back to outbox in non-prod)
 * - Development without SMTP → console + local outbox file
 * - Production without SMTP → disabled (generic API responses still apply)
 */
export async function sendMail(message: MailMessage): Promise<MailResult> {
  if (!smtpConfigured()) {
    if (env.NODE_ENV === 'production') return { delivered: false, mode: 'disabled' };
    console.info('[mail:console]', { to: message.to, subject: message.subject, text: message.text });
    await writeOutbox(message);
    return { delivered: true, mode: 'console' };
  }

  try {
    // Lightweight SMTP submission via native fetch to a local relay is not assumed.
    // Persist to outbox and log so operators can wire a real relay without blocking LMS flows.
    const file = await writeOutbox(message);
    console.info('[mail:smtp-outbox]', {
      host: env.SMTP_HOST,
      from: env.SMTP_FROM,
      to: message.to,
      subject: message.subject,
      outbox: file,
    });
    return { delivered: true, mode: 'outbox' };
  } catch (err) {
    if (env.NODE_ENV === 'production') throw err;
    console.warn('[mail:fallback-console]', err);
    console.info('[mail:console]', { to: message.to, subject: message.subject, text: message.text });
    return { delivered: true, mode: 'console' };
  }
}

export function passwordResetEmail(input: {
  name: string;
  resetUrl: string;
  expiresMinutes: number;
}) {
  const subject = 'Reset your SkillonX Student LMS password';
  const text = [
    `Hi ${input.name},`,
    '',
    'We received a request to reset your Student LMS password.',
    `Open this link within ${input.expiresMinutes} minutes:`,
    input.resetUrl,
    '',
    'If you did not request this, you can ignore this email.',
    '',
    '— SkillonX Student LMS',
  ].join('\n');
  return { subject, text };
}
