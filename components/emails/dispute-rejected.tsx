import {
    Body,
    Head,
    Html,
    Img,
    Preview
} from '@react-email/components';

interface DisputeRejectedEmailProps {
    reportId: string;
    rejectionReason?: string;
}

const baseUrl = 'https://rentercheck.ph';

export const DisputeRejectedEmail = ({
    reportId = "12345",
    rejectionReason,
}: DisputeRejectedEmailProps) => (
    <Html>
        <Head />
        <Preview>Your dispute has been reviewed</Preview>
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
                                    Dispute Rejected
                                </td>
                            </tr>
                            <tr>
                                <td style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '24px', padding: '8px 0' }}>
                                    Your dispute for report ID <strong>{reportId}</strong> has been reviewed and was <strong>rejected</strong> by our team.
                                </td>
                            </tr>
                            {rejectionReason && (
                                <tr>
                                    <td style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '24px', padding: '8px 0' }}>
                                        <strong>Reason:</strong> {rejectionReason}
                                    </td>
                                </tr>
                            )}
                            <tr>
                                <td style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '24px', padding: '8px 0' }}>
                                    After careful review of your dispute and the original report, we determined that the report meets our verification standards and will remain in our system.
                                </td>
                            </tr>
                            <tr>
                                <td style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '24px', padding: '8px 0' }}>
                                    <strong>What you can do:</strong>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '24px', padding: '0 0 8px 20px' }}>
                                    • Review the rejection reason carefully<br />
                                    • Gather additional evidence that contradicts the report<br />
                                    • Submit a new dispute with stronger supporting documentation<br />
                                    • Contact support if you believe there was an error in our review
                                </td>
                            </tr>
                            <tr>
                                <td style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '24px', padding: '8px 0' }}>
                                    We understand this may be disappointing. Our dispute review process ensures fairness to both reporters and reported individuals. If you have new evidence that wasn't previously submitted, we encourage you to file a new dispute with comprehensive documentation.
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

export default DisputeRejectedEmail;
