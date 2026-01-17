import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components';

interface IncidentApprovedEmailProps {
    reportedName: string;
    reportId: string;
}

export const IncidentApprovedEmail = ({
    reportedName,
    reportId,
}: IncidentApprovedEmailProps) => (
    <Html>
        <Head />
        <Preview>Your report has been approved</Preview>
        <Body style={main}>
            <Container style={container}>
                <Heading style={h1}>Report Approved</Heading>
                <Text style={text}>
                    Your incident report against <strong>{reportedName}</strong> has been approved and is now public.
                </Text>
                <Section style={btnContainer}>
                    <Link
                        style={button}
                        href={`https://rentercheck.ph/report/${reportId}`}
                    >
                        View Report
                    </Link>
                </Section>
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

const btnContainer = {
    textAlign: 'center' as const,
    marginTop: '32px',
    marginBottom: '32px',
};

const button = {
    backgroundColor: '#000000',
    borderRadius: '3px',
    color: '#fff',
    fontSize: '16px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '12px',
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
