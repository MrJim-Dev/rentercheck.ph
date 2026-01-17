import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Text
} from '@react-email/components';

interface DisputeApprovedEmailProps {
    reportId: string;
}

export const DisputeApprovedEmail = ({
    reportId,
}: DisputeApprovedEmailProps) => (
    <Html>
        <Head />
        <Preview>Your dispute has been approved</Preview>
        <Body style={main}>
            <Container style={container}>
                <Heading style={h1}>Dispute Resolved</Heading>
                <Text style={text}>
                    Good news! Your dispute for report ID <strong>{reportId}</strong> has been approved.
                </Text>
                <Text style={text}>
                    The report has been removed from our system and will no longer affect your record.
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
