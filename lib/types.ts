export type MatchConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

// Safe Search Types
export type MatchType =
    | 'NO_MATCH'
    | 'NAME_MATCH'        // Weak match (Possible)
    | 'PHONE_MATCH'       // Strong match
    | 'EMAIL_MATCH'       // Strong match
    | 'GOVT_ID_MATCH';    // Strongest match

export type ReportStatus = 'PENDING' | 'VERIFIED' | 'DISPUTED' | 'RESOLVED';

export type IncidentCategory =
    | 'NON_PAYMENT'
    | 'NON_RETURN'
    | 'UNPAID_BALANCE'
    | 'PROPERTY_DAMAGE'
    | 'DAMAGE_DISPUTE'
    | 'LEASE_VIOLATION'
    | 'FAKE_INFO'
    | 'THREATS_HARASSMENT'
    | 'ILLEGAL_ACTIVITY'
    | 'OTHER';

export interface Business {
    id: string;
    name: string;
    isVerified: boolean;
    email: string;
}

export interface IncidentReport {
    id: string;
    date: string; // ISO date string
    category: IncidentCategory;
    description: string;
    status: ReportStatus;
    reportingBusinessId: string; // ID of the business that reported
    evidenceUrls?: string[];
    amountInvolved?: number; // Optional, e.g. for unpaid rent
}

export interface RenterProfile {
    id: string;
    fingerprint: string; // The hashed identifier used in URL
    nameMasked: string; // e.g. "J*** D**"
    matchConfidence: MatchConfidence;
    matchType: MatchType;
    totalIncidents: number;
    lastIncidentDate?: string;
    incidents: IncidentReport[];
    verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'FLAGGED';
}

export interface SearchResult {
    query: string;
    timestamp: string;
    matches: RenterProfile[];
}
