import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Text,
} from '@react-email/components';

interface IncidentUnderReviewEmailProps {
    reportedName: string;
    adminNotes?: string;
}

export const IncidentUnderReviewEmail = ({
    reportedName,
    adminNotes,
}: IncidentUnderReviewEmailProps) => (
    <Html>
        <Head />
        <Preview>Your report is under review</Preview>
        <Body style={main}>
            <Container style={container}>
                <Heading style={h1}>Report Under Review</Heading>
                <Text style={text}>
                    Your incident report against <strong>{reportedName}</strong> is currently being reviewed by our team.
                </Text>
                <Text style={text}>
                    We may request additional information to verify the details of your report. Please check your dashboard for any updates or information requests.
                </Text>
                {adminNotes && (
                    <Text style={text}>
                        <strong>Note from Admin:</strong> {adminNotes}
                    </Text>
                )}
                <Hr style={hr} />
                <Text style={footer}>
                    RenterCheck.ph - Protect your rental business.
                </Text>
            </Container>
        </Body>
    </Html>
);

const main = {
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
    width: '560px',
};

const h1 = {
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '1.25',
    marginBottom: '24px',
    color: '#484848',
};

const text = {
    fontSize: '16px',
    lineHeight: '26px',
    color: '#484848',
};

const hr = {
    borderColor: '#cccccc',
    margin: '20px 0',
};

const footer = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '16px',
};
