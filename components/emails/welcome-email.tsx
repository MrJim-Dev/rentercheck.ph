import {
    Body,
    Head,
    Html,
    Img,
    Preview
} from '@react-email/components';

interface WelcomeEmailProps {
    name: string;
}

const baseUrl = 'https://rentercheck.ph';

export const WelcomeEmail = ({
    name = "Valued Member",
}: WelcomeEmailProps) => (
    <Html>
        <Head />
        <Preview>Your account is ready — start verifying renters and reporting incidents today.</Preview>
        <Body style={{
            backgroundColor: '#f4f4f4',
            fontFamily: 'Arial, sans-serif',
            margin: '0',
            padding: '0',
        }}>
            <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#f4f4f4', padding: '40px 0' }}>
                <tr>
                    <td align="center">
                        <table width="600" cellPadding="0" cellSpacing="0" style={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #1e293b',
                            borderRadius: '8px',
                            padding: '40px',
                            maxWidth: '600px',
                        }}>
                            <tr>
                                <td align="center" style={{ paddingBottom: '16px' }}>
                                    <Img
                                        src={`${baseUrl}/logos/rc-logo.png`}
                                        width="64"
                                        height="64"
                                        alt="RenterCheck"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style={{
                                    color: '#f5f7fa',
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    padding: '16px 0',
                                }}>
                                    Welcome to RenterCheck
                                </td>
                            </tr>
                            <tr>
                                <td style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '24px', padding: '8px 0' }}>
                                    Hi {name},
                                </td>
                            </tr>
                            <tr>
                                <td style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '24px', padding: '8px 0' }}>
                                    RenterCheck helps rental owners make smarter leasing decisions. Share and check rental experiences to reduce scams and promote transparency.
                                </td>
                            </tr>
                            <tr>
                                <td style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '24px', padding: '8px 0' }}>
                                    You can start by checking a renter's history or, if applicable, contributing a report to help other rental owners.
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style={{ padding: '32px 0' }}>
                                    <a
                                        href={`${baseUrl}/report`}
                                        style={{
                                            backgroundColor: '#00a4ef',
                                            borderRadius: '4px',
                                            color: '#000000',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            textDecoration: 'none',
                                            padding: '12px 20px',
                                            display: 'inline-block',
                                        }}
                                    >
                                        Report an Incident
                                    </a>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ borderTop: '1px solid #1e293b', padding: '32px 0 0 0' }}>
                                    <table width="100%" cellPadding="0" cellSpacing="0">
                                        <tr>
                                            <td style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '24px', paddingBottom: '20px' }}>
                                                Thank you for being part of the RenterCheck community.
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#888888', fontSize: '11px', lineHeight: '18px', paddingBottom: '20px', fontStyle: 'italic' }}>
                                                Security Notice: This email was sent to you because you created a RenterCheck account. We will never ask for your password via email.
                                            </td>
                                        </tr>
                                        <tr>
                                            <td align="center" style={{ color: '#888888', fontSize: '12px', padding: '8px 0' }}>
                                                <a href={`${baseUrl}/legal/privacy`} style={{ color: '#888888', textDecoration: 'underline', margin: '0 8px' }}>Privacy Policy</a>
                                                {' | '}
                                                <a href={`${baseUrl}/legal/terms`} style={{ color: '#888888', textDecoration: 'underline', margin: '0 8px' }}>Terms</a>
                                                {' | '}
                                                <a href={`${baseUrl}/help`} style={{ color: '#888888', textDecoration: 'underline', margin: '0 8px' }}>Help Center</a>
                                                {' | '}
                                                <a href={`${baseUrl}/unsubscribe`} style={{ color: '#888888', textDecoration: 'underline', margin: '0 8px' }}>Unsubscribe</a>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td align="center" style={{ color: '#666666', fontSize: '11px', padding: '16px 0 0 0' }}>
                                                © 2026 RenterCheck. All rights reserved.
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </Body>
    </Html>
);

export default WelcomeEmail;
