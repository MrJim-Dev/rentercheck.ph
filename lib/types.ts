// ============================================
// CONFIDENCE & MATCH TYPES
// ============================================

/** Confidence level for identity matching */
export type ConfidenceLevel = 'CONFIRMED' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

/** Legacy match confidence (for backward compatibility) */
export type MatchConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

/** Match signal types - what contributed to the match */
export type MatchSignalType =
    | 'PHONE_EXACT'
    | 'EMAIL_EXACT'
    | 'FACEBOOK_EXACT'
    | 'NAME_EXACT'
    | 'NAME_FUZZY'
    | 'NAME_FIRST_LAST'
    | 'CITY_MATCH'
    | 'REGION_MATCH'
    | 'PARTIAL_PHONE';

/** Legacy match type (for backward compatibility) */
export type MatchType =
    | 'NO_MATCH'
    | 'NAME_MATCH'        // Weak match (Possible)
    | 'PHONE_MATCH'       // Strong match
    | 'EMAIL_MATCH'       // Strong match
    | 'FACEBOOK_MATCH'    // Strong match
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

// ============================================
// BUSINESS & INCIDENT TYPES
// ============================================

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

// ============================================
// RENTER PROFILE TYPES
// ============================================

/** Legacy renter profile type */
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

/** Summary of an incident for display (non-sensitive info only) */
export interface IncidentSummary {
    type: string;
    typeLabel: string;
    category: string | null;
    categoryLabel: string | null;
    itemDescription: string | null;
    date: string;
    location: string | null;
    amountInvolved: number | null;
}

/** New search result with confidence scoring */
export interface SearchResultRenter {
    id: string;
    fingerprint: string;
    fullName: string;
    nameMasked: string;
    /** Known aliases */
    aliases?: string[];
    city: string | null;
    region: string | null;
    totalIncidents: number;
    verifiedIncidents: number;
    lastIncidentDate: string | null;
    verificationStatus: string | null;
    identifierCount: number;
    /** Summary of incidents (only shown for confirmed matches) */
    incidentSummaries?: IncidentSummary[];
}

/** Match details for a search result */
export interface SearchResultMatch {
    renter: SearchResultRenter;
    /** Match confidence score (0-100) */
    score: number;
    /** Confidence level */
    confidence: ConfidenceLevel;
    /** Human-readable match reason */
    matchReason: string;
    /** List of signal types that contributed */
    matchSignals: MatchSignalType[];
    /** Whether strong identifier (phone/email/fb) matched */
    hasStrongMatch: boolean;
    /** Suggested action for low/medium confidence */
    suggestedAction?: string;
    /** Whether to show detailed info */
    showDetails: boolean;
    /** Whether user needs to add more info */
    requiresConfirmation: boolean;
    /** Display label for the match */
    displayLabel: string;
}

// ============================================
// SEARCH TYPES
// ============================================

export interface SearchQuery {
    query?: string;
    name?: string;
    phone?: string;
    email?: string;
    facebook?: string;
    city?: string;
    region?: string;
}

export interface SearchFilters {
    minConfidence?: number;
    maxResults?: number;
    requireStrongMatch?: boolean;
    includeUnverified?: boolean;
}

export interface SearchResponse {
    success: boolean;
    error?: string;
    results: SearchResultMatch[];
    totalCount: number;
    query: SearchQuery;
    meta: {
        searchTime: number;
        hasStrongInput: boolean;
        tips?: string[];
    };
}

/** Legacy search result type */
export interface SearchResult {
    query: string;
    timestamp: string;
    matches: RenterProfile[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Convert confidence level to percentage for display */
export function confidenceToPercent(confidence: ConfidenceLevel): number {
    switch (confidence) {
        case 'CONFIRMED': return 95;
        case 'HIGH': return 80;
        case 'MEDIUM': return 60;
        case 'LOW': return 35;
        case 'NONE': return 10;
    }
}

/** Check if a match type is strong (phone/email/fb/govt_id) */
export function isStrongMatchType(type: MatchType): boolean {
    return ['PHONE_MATCH', 'EMAIL_MATCH', 'FACEBOOK_MATCH', 'GOVT_ID_MATCH'].includes(type);
}

/** Check if any signal is a strong identifier */
export function hasStrongSignal(signals: MatchSignalType[]): boolean {
    return signals.some(s => ['PHONE_EXACT', 'EMAIL_EXACT', 'FACEBOOK_EXACT'].includes(s));
}
