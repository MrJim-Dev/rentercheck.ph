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
                                    RenterCheck is building a centralized database of renter experiences so rental businesses can background-check potential renters before handing the keys.
                                </td>
                            </tr>
                            <tr>
                                <td style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '24px', padding: '8px 0' }}>
                                    Whether you rent out real estate, vehicles, gadgets, clothing, or any other items, you'll be able to see if a renter has had reported incidents with other rentals—so you can approve renters with confidence.
                                </td>
                            </tr>
                            <tr>
                                <td style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: '600', lineHeight: '24px', padding: '24px 0 8px 0' }}>
                                    With RenterCheck, you can:
                                </td>
                            </tr>
                            <tr>
                                <td style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '24px', padding: '4px 0 4px 20px' }}>
                                    • Reduce risk by spotting repeat offenders early
                                </td>
                            </tr>
                            <tr>
                                <td style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '24px', padding: '4px 0 4px 20px' }}>
                                    • Make faster approvals with more confidence
                                </td>
                            </tr>
                            <tr>
                                <td style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '24px', padding: '4px 0 4px 20px' }}>
                                    • Protect your business from costly losses and disputes
                                </td>
                            </tr>
                            <tr>
                                <td style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '24px', padding: '4px 0 4px 20px' }}>
                                    • Help the rental community by sharing verified experiences
                                </td>
                            </tr>
                            <tr>
                                <td style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '24px', padding: '16px 0 8px 0' }}>
                                    If you've had a bad renter experience, please report it. Your report can help other rental owners avoid the same issue. We review reports to keep the database reliable and fair.
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style={{ padding: '32px 0 8px 0' }}>
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
                                <td align="center" style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '20px', padding: '8px 0 16px 0' }}>
                                    Or start by searching a renter's name to see if there are matching records.
                                </td>
                            </tr>
                            <tr>
                                <td style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '24px', padding: '16px 0 8px 0' }}>
                                    Thank you for helping build a safer rental community,
                                    <br />
                                    — RenterCheck Team
                                </td>
                            </tr>
                            <tr>
                                <td style={{ borderTop: '1px solid #1e293b', padding: '32px 0 0 0' }}>
                                    <table width="100%" cellPadding="0" cellSpacing="0">
                                        <tr>
                                            <td style={{ color: '#888888', fontSize: '11px', lineHeight: '18px', paddingBottom: '20px', fontStyle: 'italic' }}>
                                                Security Notice: This email was sent because you created a RenterCheck account. We will never ask for your password via email.
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
