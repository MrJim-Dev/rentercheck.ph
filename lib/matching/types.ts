/**
 * Types for the renter matching system
 */

import type { Database } from '../database.types';
import type { MatchSignalType } from './scoring';

// Re-export scoring types
export type {
  ConfidenceLevel,
  MatchSignalType,
  MatchSignal,
  MatchPenalty,
  MatchResult,
  SearchInput,
  CandidateData,
} from './scoring';

// ============================================
// SEARCH TYPES
// ============================================

export interface SearchQuery {
  /** Free-text query (name, phone, email, etc.) */
  query?: string;
  /** Specific name to search */
  name?: string;
  /** Phone number to search */
  phone?: string;
  /** Email address to search */
  email?: string;
  /** Facebook URL/username to search */
  facebook?: string;
  /** Filter by city */
  city?: string;
  /** Filter by region */
  region?: string;
}

export interface SearchFilters {
  /** Minimum confidence score (0-100) */
  minConfidence?: number;
  /** Maximum number of results */
  maxResults?: number;
  /** Only show results with strong identifier match */
  requireStrongMatch?: boolean;
  /** Include unverified renters */
  includeUnverified?: boolean;
}

// ============================================
// SEARCH RESULT TYPES
// ============================================

/** Summary of an incident for display */
export interface IncidentSummary {
  /** Incident type */
  type: string;
  /** Human-readable incident type label */
  typeLabel: string;
  /** Rental category */
  category: string | null;
  /** Category label */
  categoryLabel: string | null;
  /** Rented item description */
  itemDescription: string | null;
  /** Incident date */
  date: string;
  /** Location (city/region) */
  location: string | null;
  /** Amount involved */
  amountInvolved: number | null;
}

export interface SearchResultRenter {
  /** Renter ID */
  id: string;
  /** Unique fingerprint for URL */
  fingerprint: string;
  /** Full name (may be masked for weak matches) */
  fullName: string;
  /** Masked name for display (e.g., "J*** D***") */
  nameMasked: string;
  /** Known aliases */
  aliases?: string[];
  /** City */
  city: string | null;
  /** Region */
  region: string | null;
  /** Total incidents reported */
  totalIncidents: number;
  /** Verified incidents count */
  verifiedIncidents: number;
  /** Last incident date */
  lastIncidentDate: string | null;
  /** Verification status */
  verificationStatus: string | null;
  /** Identifiers count (not the actual values for privacy) */
  identifierCount: number;
  /** Summary of incidents for display (non-sensitive info only) */
  incidentSummaries?: IncidentSummary[];
}

export interface SearchResultMatch {
  /** The renter data */
  renter: SearchResultRenter;
  /** Match confidence score (0-100) */
  score: number;
  /** Confidence level */
  confidence: 'CONFIRMED' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
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

export interface SearchResponse {
  /** Search was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** The results */
  results: SearchResultMatch[];
  /** Total count before pagination */
  totalCount: number;
  /** The query that was executed */
  query: SearchQuery;
  /** Metadata about the search */
  meta: {
    /** Time taken in ms */
    searchTime: number;
    /** Whether any strong identifiers were in the query */
    hasStrongInput: boolean;
    /** Tips for improving search */
    tips?: string[];
    /** Whether authentication is required to see results */
    requiresAuth?: boolean;
  };
}

// ============================================
// RENTER PROFILE TYPES (for detailed view)
// ============================================

export interface RenterIncidentSummary {
  id: string;
  incidentType: Database['public']['Enums']['incident_type'];
  incidentDate: string;
  incidentCity: string | null;
  incidentRegion: string | null;
  amountInvolved: number | null;
  status: Database['public']['Enums']['report_status'];
  evidenceCount: number;
  /** Truncated summary for public view */
  summaryTruncated: string | null;
}

export interface RenterProfileDetailed {
  /** Basic renter info */
  id: string;
  fingerprint: string;
  fullName: string;
  nameMasked: string;
  city: string | null;
  region: string | null;
  verificationStatus: string | null;
  createdAt: string | null;
  
  /** Incident statistics */
  totalIncidents: number;
  verifiedIncidents: number;
  lastIncidentDate: string | null;
  
  /** Incident breakdown by type */
  incidentsByType: Record<string, number>;
  
  /** Recent incidents (public summaries only) */
  recentIncidents: RenterIncidentSummary[];
  
  /** Risk indicators */
  riskIndicators: {
    /** Total amount involved across all incidents */
    totalAmountInvolved: number;
    /** Recency score (how recent is the last incident) */
    recencyScore: 'RECENT' | 'MODERATE' | 'OLD';
    /** Evidence quality score */
    evidenceScore: 'HIGH' | 'MEDIUM' | 'LOW';
  };
}

// ============================================
// HELPER TYPES
// ============================================

/** Raw renter row from database */
export type RenterRow = Database['public']['Tables']['renters']['Row'];

/** Raw identifier row from database */
export type IdentifierRow = Database['public']['Tables']['renter_identifiers']['Row'];

/** Raw incident report row */
export type IncidentRow = Database['public']['Tables']['incident_reports']['Row'];

/** Public renter profile view */
export type PublicRenterView = Database['public']['Views']['public_renter_profiles']['Row'];

/** Public incident summary view */
export type PublicIncidentView = Database['public']['Views']['public_incident_summaries']['Row'];
