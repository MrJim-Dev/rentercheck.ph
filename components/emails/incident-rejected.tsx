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

interface IncidentRejectedEmailProps {
    reportedName: string;
    rejectionReason?: string;
}

export const IncidentRejectedEmail = ({
    reportedName,
    rejectionReason,
}: IncidentRejectedEmailProps) => (
    <Html>
        <Head />
        <Preview>Your report has been rejected</Preview>
        <Body style={main}>
            <Container style={container}>
                <Heading style={h1}>Report Rejected</Heading>
                <Text style={text}>
                    Your incident report against <strong>{reportedName}</strong> has been reviewed and was <strong>rejected</strong> by our team.
                </Text>
                {rejectionReason && (
                    <Text style={text}>
                        <strong>Reason:</strong> {rejectionReason}
                    </Text>
                )}
                <Text style={text}>
                    This report will not be published and has been removed from our public records.
                </Text>
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
