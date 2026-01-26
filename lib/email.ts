import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailProps {
    to: string;
    subject: string;
    react: React.ReactElement;
}

export const sendEmail = async ({ to, subject, react }: SendEmailProps) => {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not set. Email not sent.');
        return { success: false, error: 'Missing API Key' };
    }

    try {
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
