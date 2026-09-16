import { Resend } from 'resend';

interface SendEmailProps {
    to: string;
    subject: string;
    react: React.ReactElement;
}

export const sendEmail = async ({ to, subject, react }: SendEmailProps) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.warn('RESEND_API_KEY is not set. Email not sent.');
        return { success: false, error: 'Missing API Key' };
    }

    try {
        const resend = new Resend(apiKey);
        const data = await resend.emails.send({
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
