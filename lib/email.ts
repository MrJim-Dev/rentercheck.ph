import { Resend } from 'resend';

let resend: Resend | undefined;

function getResend() {
    if (!process.env.RESEND_API_KEY) return undefined;
    return (resend ??= new Resend(process.env.RESEND_API_KEY));
}

interface SendEmailProps {
    to: string;
    subject: string;
    react: React.ReactElement;
}

export const sendEmail = async ({ to, subject, react }: SendEmailProps) => {
    const client = getResend();
    if (!client) {
        console.warn('RESEND_API_KEY is not set. Email not sent.');
        return { success: false, error: 'Missing API Key' };
    }

    try {
        const data = await client.emails.send({
            from: 'RenterCheck <noreply@rentercheck.ph>',
            to,
            subject,
            react,
        });

        return { success: true, data };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error };
    }
};

export async function sendMrJimAuthEmail({
    to,
    subject,
    actionUrl,
    idempotencyKey,
}: {
    to: string;
    subject: string;
    actionUrl: string;
    idempotencyKey?: string;
}) {
    const client = getResend();
    if (!client) {
        console.warn('RESEND_API_KEY is not set. Auth email not sent.');
        return { success: false, error: 'Missing API Key' };
    }
    try {
        const result = await client.emails.send({
            from: 'RenterCheck <noreply@rentercheck.ph>',
            to,
            subject,
            headers: idempotencyKey ? { 'X-RenterCheck-Idempotency-Key': idempotencyKey } : undefined,
            html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h1>RenterCheck</h1><p>Use the secure link below to continue.</p><p><a href="${actionUrl.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}">Continue to RenterCheck</a></p><p>This link expires shortly.</p></div>`,
        });
        return { success: true, data: result };
    } catch (error) {
        console.error('Error sending MrJim Auth email:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Email delivery failed' };
    }
}
