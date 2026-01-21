import {
    Body,
    Head,
    Html,
    Img,
    Preview
} from '@react-email/components';

interface IncidentUnderReviewEmailProps {
    reportedName: string;
    adminNotes?: string;
}

const baseUrl = 'https://rentercheck.ph';

export const IncidentUnderReviewEmail = ({
    reportedName = "John Doe",
    adminNotes,
}: IncidentUnderReviewEmailProps) => (
    <Html>
        <Head />
        <Preview>Your report is under review</Preview>
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
                                    Report Under Review
                                </td>
                            </tr>
                            <tr>
                                <td style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '24px', padding: '8px 0' }}>
                                    Your incident report against <strong>{reportedName}</strong> is currently being reviewed by our team.
                                </td>
                            </tr>
                            <tr>
                                <td style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '24px', padding: '8px 0' }}>
                                    We may request additional information to verify the details of your report. Please check your dashboard for any updates or information requests.
                                </td>
                            </tr>
                            {adminNotes && (
                                <tr>
                                    <td style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '24px', padding: '8px 0' }}>
                                        <strong>Note from Admin:</strong> {adminNotes}
                                    </td>
                                </tr>
                            )}
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

export default IncidentUnderReviewEmail;
