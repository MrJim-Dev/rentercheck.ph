import {
    Body,
    Button,
    Head,
    Html,
    Img,
    Preview,
    Section,
} from '@react-email/components';

interface NewReportAdminEmailProps {
    reportId: string;
    reportedName: string;
    reporterEmail: string;
    incidentType: string;
    incidentDate: string;
    summary: string;
    amountInvolved?: number;
}

const baseUrl = 'https://rentercheck.ph';

export const NewReportAdminEmail = ({
    reportId = "12345",
    reportedName = "John Doe",
    reporterEmail = "reporter@example.com",
    incidentType = "NON_PAYMENT",
    incidentDate = "2026-01-21",
    summary = "Sample summary",
    amountInvolved,
}: NewReportAdminEmailProps) => (
    <Html>
        <Head />
        <Preview>New report submitted - {reportedName}</Preview>
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
                                    🚨 New Report Submitted
                                </td>
                            </tr>
                            <tr>
                                <td style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '24px', padding: '8px 0' }}>
                                    A new incident report has been submitted and requires your review.
                                </td>
                            </tr>

                            {/* Report Details */}
                            <tr>
                                <td style={{
                                    backgroundColor: '#1e293b',
                                    borderRadius: '6px',
                                    padding: '20px',
                                    margin: '16px 0',
                                }}>
                                    <table width="100%" cellPadding="0" cellSpacing="0">
                                        <tr>
                                            <td style={{ color: '#94a3b8', fontSize: '12px', paddingBottom: '4px' }}>
                                                Report ID
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#f5f7fa', fontSize: '14px', fontWeight: 'bold', paddingBottom: '16px' }}>
                                                {reportId}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#94a3b8', fontSize: '12px', paddingBottom: '4px' }}>
                                                Reported Individual
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#f5f7fa', fontSize: '14px', fontWeight: 'bold', paddingBottom: '16px' }}>
                                                {reportedName}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#94a3b8', fontSize: '12px', paddingBottom: '4px' }}>
                                                Reporter Email
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#f5f7fa', fontSize: '14px', paddingBottom: '16px' }}>
                                                {reporterEmail}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#94a3b8', fontSize: '12px', paddingBottom: '4px' }}>
                                                Incident Type
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#f5f7fa', fontSize: '14px', paddingBottom: '16px' }}>
                                                {incidentType.replace(/_/g, ' ')}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#94a3b8', fontSize: '12px', paddingBottom: '4px' }}>
                                                Incident Date
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#f5f7fa', fontSize: '14px', paddingBottom: '16px' }}>
                                                {incidentDate}
                                            </td>
                                        </tr>
                                        {amountInvolved && (
                                            <>
                                                <tr>
                                                    <td style={{ color: '#94a3b8', fontSize: '12px', paddingBottom: '4px' }}>
                                                        Amount Involved
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style={{ color: '#f5f7fa', fontSize: '14px', fontWeight: 'bold', paddingBottom: '16px' }}>
                                                        ₱{amountInvolved.toLocaleString()}
                                                    </td>
                                                </tr>
                                            </>
                                        )}
                                        <tr>
                                            <td style={{ color: '#94a3b8', fontSize: '12px', paddingBottom: '4px' }}>
                                                Summary
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '20px' }}>
                                                {summary.length > 200 ? `${summary.substring(0, 200)}...` : summary}
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            {/* Action Button */}
                            <tr>
                                <td align="center" style={{ padding: '24px 0' }}>
                                    <Button
                                        href={`${baseUrl}/admin?tab=reports`}
                                        style={{
                                            backgroundColor: '#3b82f6',
                                            borderRadius: '6px',
                                            color: '#ffffff',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            textDecoration: 'none',
                                            textAlign: 'center',
                                            display: 'inline-block',
                                            padding: '12px 32px',
                                        }}
                                    >
                                        Review in Admin Panel
                                    </Button>
                                </td>
                            </tr>

                            <tr>
                                <td style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '20px', padding: '16px 0', textAlign: 'center' }}>
                                    Please review this report promptly to maintain the integrity of the platform.
                                </td>
                            </tr>

                            <tr>
                                <td style={{ borderTop: '1px solid #1e293b', padding: '32px 0 0 0' }}>
                                    <table width="100%" cellPadding="0" cellSpacing="0">
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

export default NewReportAdminEmail;
