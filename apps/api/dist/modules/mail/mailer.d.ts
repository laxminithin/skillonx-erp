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
/**
 * Mail provider abstraction.
 * - SMTP_* configured → delivery attempted (requires external SMTP; failures fall back to outbox in non-prod)
 * - Development without SMTP → console + local outbox file
 * - Production without SMTP → disabled (generic API responses still apply)
 */
export declare function sendMail(message: MailMessage): Promise<MailResult>;
export declare function passwordResetEmail(input: {
    name: string;
    resetUrl: string;
    expiresMinutes: number;
}): {
    subject: string;
    text: string;
};
