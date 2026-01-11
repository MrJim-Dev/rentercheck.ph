import { IncidentReport, RenterProfile } from './types';

export const MOCK_INCIDENTS: IncidentReport[] = [
    {
        id: 'inc-001',
        date: '2025-10-15',
        category: 'NON_PAYMENT',
        description: 'Tenant failed to pay rent for 3 consecutive months and vacated without notice.',
        status: 'VERIFIED',
        reportingBusinessId: 'biz-001',
        amountInvolved: 45000,
    },
    {
        id: 'inc-002',
        date: '2024-05-20',
        category: 'PROPERTY_DAMAGE',
        description: 'Significant damage to bathroom fixtures and kitchen cabinets beyond normal wear and tear.',
        status: 'VERIFIED',
        reportingBusinessId: 'biz-002',
        amountInvolved: 15000,
    },
    {
        id: 'inc-003',
        date: '2025-12-01',
        category: 'LEASE_VIOLATION',
        description: 'Unauthorized subletting of the unit discovered.',
        status: 'DISPUTED',
        reportingBusinessId: 'biz-003',
    }
];

export const MOCK_RENTERS: RenterProfile[] = [
    {
        id: 'renter-001',
        fingerprint: 'a1b2c3d4e5f6',
        nameMasked: 'J*** S****',
        matchConfidence: 'HIGH',
        matchType: 'PHONE_MATCH', // Strong match
        totalIncidents: 2,
        lastIncidentDate: '2025-10-15',
        incidents: [MOCK_INCIDENTS[0], MOCK_INCIDENTS[1]],
        verificationStatus: 'VERIFIED',
    },
    {
        id: 'renter-002',
        fingerprint: 'f6e5d4c3b2a1',
        nameMasked: 'M**** P******',
        matchConfidence: 'MEDIUM',
        matchType: 'NAME_MATCH', // Weak match, should hide details
        totalIncidents: 1,
        lastIncidentDate: '2025-12-01',
        incidents: [MOCK_INCIDENTS[2]],
        verificationStatus: 'FLAGGED',
    },
    {
        id: 'renter-003',
        fingerprint: '1234567890ab',
        nameMasked: 'R**** D**',
        matchConfidence: 'HIGH',
        matchType: 'EMAIL_MATCH', // Strong match
        lastIncidentDate: '2025-12-01',
        totalIncidents: 1,
        incidents: [MOCK_INCIDENTS[2]],
        verificationStatus: 'UNVERIFIED',
    }
];

export const getMockRenterByFingerprint = (fingerprint: string): RenterProfile | undefined => {
    return MOCK_RENTERS.find(r => r.fingerprint === fingerprint);
};

export const searchMockRenters = (query: string): RenterProfile[] => {
    if (!query) return [];
    const q = query.toLowerCase();

    // Demo: Return all if 'all'
    if (q === 'all') return MOCK_RENTERS;

    // Simulate Name Search (Weak Match)
    // If query looks like a name (no numbers, no @)
    if (!q.match(/\d/) && !q.includes('@')) {
        // Return the Name Match scenario
        return [MOCK_RENTERS[1]];
    }

    // Simulate Phone/Email Search (Strong Match)
    // If query has numbers or @
    if (q.match(/\d/) || q.includes('@')) {
        // Return the Phone/Email Match scenarios
        return [MOCK_RENTERS[0], MOCK_RENTERS[2]];
    }

    return [];
};
