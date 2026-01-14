/**
 * Confidence Scoring Algorithm for Renter Matching
 * 
 * Key principle: Confidence measures "is this the same person?"
 * This is SEPARATE from severity (risk level) and trust (report credibility)
 * 
 * Scoring Model (0-100):
 * - 90-100: Confirmed match
 * - 70-89: High confidence
 * - 50-69: Medium confidence
 * - 25-49: Low confidence
 * - 0-24: No reliable match
 */

import {
  normalizeEmail,
  normalizeFacebookUrl,
  normalizeName,
  normalizePhone,
  getFirstLastName,
  normalizeLocation,
} from './normalizers';
import { nameSimilarity, areNamesSimilar } from './similarity';

// ============================================
// TYPES
// ============================================

export type ConfidenceLevel = 'CONFIRMED' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

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

export interface MatchSignal {
  type: MatchSignalType;
  points: number;
  description: string;
  /** Whether this is a strong identifier (phone/email/fb) */
  isStrong: boolean;
}

export interface MatchPenalty {
  type: 'NAME_MISMATCH' | 'LOCATION_MISMATCH' | 'MULTIPLE_WEAK_MATCHES';
  points: number;
  description: string;
}

export interface MatchResult {
  /** Raw score (0-100+, can exceed 100 before capping) */
  rawScore: number;
  /** Final score (0-100, capped) */
  score: number;
  /** Confidence level based on score */
  confidence: ConfidenceLevel;
  /** List of positive signals that contributed to the score */
  signals: MatchSignal[];
  /** List of penalties applied */
  penalties: MatchPenalty[];
  /** Whether at least one strong identifier matched */
  hasStrongMatch: boolean;
  /** Human-readable match reason for UI */
  matchReason: string;
  /** Suggested CTA if confidence is low/medium */
  suggestedAction?: string;
}

export interface SearchInput {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  facebook?: string | null;
  city?: string | null;
  region?: string | null;
}

export interface CandidateData {
  id: string;
  fullName: string;
  fullNameNormalized?: string | null;
  city?: string | null;
  region?: string | null;
  identifiers: Array<{
    type: 'PHONE' | 'EMAIL' | 'FACEBOOK' | 'GOVT_ID';
    normalized: string;
    value: string;
  }>;
}

// ============================================
// SCORING WEIGHTS
// ============================================

const WEIGHTS = {
  // Strong identifier matches (high confidence)
  PHONE_EXACT: 80,
  EMAIL_EXACT: 75,
  FACEBOOK_EXACT: 85,

  // Name matches
  NAME_EXACT: 25, // After normalization
  NAME_FUZZY_HIGH: 15, // >= 0.92 similarity
  NAME_FUZZY_MEDIUM: 10, // >= 0.85 similarity
  NAME_FIRST_LAST_ONLY: 10, // First + last match, middle differs

  // Location matches
  CITY_MATCH: 10,
  REGION_MATCH: 5,

  // Partial matches (weaker)
  PARTIAL_PHONE_LAST4: 5, // Only if we store last 4 digits

  // Penalties
  PENALTY_NAME_MISMATCH: -30, // Strong ID matches but name very different
  PENALTY_MULTIPLE_WEAK: -15, // Cap for name-only searches with multiple matches
} as const;

// ============================================
// SCORE TO CONFIDENCE MAPPING
// ============================================

export function scoreToConfidence(score: number): ConfidenceLevel {
  if (score >= 90) return 'CONFIRMED';
  if (score >= 70) return 'HIGH';
  if (score >= 50) return 'MEDIUM';
  if (score >= 25) return 'LOW';
  return 'NONE';
}

export function confidenceToLabel(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'CONFIRMED':
      return 'Confirmed Match';
    case 'HIGH':
      return 'High Confidence';
    case 'MEDIUM':
      return 'Medium Confidence';
    case 'LOW':
      return 'Low Confidence';
    case 'NONE':
      return 'No Reliable Match';
  }
}

// ============================================
// MAIN SCORING FUNCTION
// ============================================

/**
 * Calculate match confidence between search input and a candidate
 * 
 * @param search - The search criteria (what user entered)
 * @param candidate - A potential match from the database
 * @returns MatchResult with score, confidence, and signals
 */
export function calculateMatchScore(
  search: SearchInput,
  candidate: CandidateData
): MatchResult {
  const signals: MatchSignal[] = [];
  const penalties: MatchPenalty[] = [];
  let score = 0;
  let hasStrongMatch = false;

  // Normalize search inputs
  const searchPhoneNorm = normalizePhone(search.phone);
  const searchEmailNorm = normalizeEmail(search.email);
  const searchFacebookNorm = normalizeFacebookUrl(search.facebook);
  const searchNameNorm = normalizeName(search.name);
  const searchCityNorm = normalizeLocation(search.city);
  const searchRegionNorm = normalizeLocation(search.region);

  // Normalize candidate data
  const candidateNameNorm = candidate.fullNameNormalized || normalizeName(candidate.fullName);
  const candidateCityNorm = normalizeLocation(candidate.city);
  const candidateRegionNorm = normalizeLocation(candidate.region);

  // ============================================
  // CHECK STRONG IDENTIFIERS
  // ============================================

  // Phone match
  if (searchPhoneNorm) {
    const phoneMatch = candidate.identifiers.find(
      (id) => id.type === 'PHONE' && id.normalized === searchPhoneNorm
    );
    if (phoneMatch) {
      hasStrongMatch = true;
      signals.push({
        type: 'PHONE_EXACT',
        points: WEIGHTS.PHONE_EXACT,
        description: 'Phone number matches',
        isStrong: true,
      });
      score += WEIGHTS.PHONE_EXACT;
    }
  }

  // Email match
  if (searchEmailNorm) {
    const emailMatch = candidate.identifiers.find(
      (id) => id.type === 'EMAIL' && id.normalized === searchEmailNorm
    );
    if (emailMatch) {
      hasStrongMatch = true;
      signals.push({
        type: 'EMAIL_EXACT',
        points: WEIGHTS.EMAIL_EXACT,
        description: 'Email address matches',
        isStrong: true,
      });
      score += WEIGHTS.EMAIL_EXACT;
    }
  }

  // Facebook match
  if (searchFacebookNorm) {
    const fbMatch = candidate.identifiers.find(
      (id) => id.type === 'FACEBOOK' && id.normalized === searchFacebookNorm
    );
    if (fbMatch) {
      hasStrongMatch = true;
      signals.push({
        type: 'FACEBOOK_EXACT',
        points: WEIGHTS.FACEBOOK_EXACT,
        description: 'Facebook profile matches',
        isStrong: true,
      });
      score += WEIGHTS.FACEBOOK_EXACT;
    }
  }

  // ============================================
  // CHECK NAME
  // ============================================

  if (searchNameNorm && candidateNameNorm) {
    // Exact match (after normalization)
    if (searchNameNorm === candidateNameNorm) {
      signals.push({
        type: 'NAME_EXACT',
        points: WEIGHTS.NAME_EXACT,
        description: 'Name exactly matches',
        isStrong: false,
      });
      score += WEIGHTS.NAME_EXACT;
    } else {
      // Fuzzy match
      const nameComparison = areNamesSimilar(searchNameNorm, candidateNameNorm);

      if (nameComparison.score >= 0.92) {
        signals.push({
          type: 'NAME_FUZZY',
          points: WEIGHTS.NAME_FUZZY_HIGH,
          description: `Name closely matches (${Math.round(nameComparison.score * 100)}% similar)`,
          isStrong: false,
        });
        score += WEIGHTS.NAME_FUZZY_HIGH;
      } else if (nameComparison.score >= 0.85) {
        signals.push({
          type: 'NAME_FUZZY',
          points: WEIGHTS.NAME_FUZZY_MEDIUM,
          description: `Name partially matches (${Math.round(nameComparison.score * 100)}% similar)`,
          isStrong: false,
        });
        score += WEIGHTS.NAME_FUZZY_MEDIUM;
      } else {
        // Check first + last name only
        const searchFirstLast = getFirstLastName(search.name);
        const candidateFirstLast = getFirstLastName(candidate.fullName);

        if (searchFirstLast && candidateFirstLast) {
          const firstLastSimilarity = nameSimilarity(searchFirstLast, candidateFirstLast);
          if (firstLastSimilarity >= 0.90) {
            signals.push({
              type: 'NAME_FIRST_LAST',
              points: WEIGHTS.NAME_FIRST_LAST_ONLY,
              description: 'First and last name match',
              isStrong: false,
            });
            score += WEIGHTS.NAME_FIRST_LAST_ONLY;
          }
        }
      }

      // PENALTY: Strong identifier matches but name is very different
      if (hasStrongMatch && nameComparison.score < 0.6) {
        penalties.push({
          type: 'NAME_MISMATCH',
          points: WEIGHTS.PENALTY_NAME_MISMATCH,
          description: 'Identifier matches but name differs significantly',
        });
        score += WEIGHTS.PENALTY_NAME_MISMATCH;
      }
    }
  }

  // ============================================
  // CHECK LOCATION
  // ============================================

  // City match
  if (searchCityNorm && candidateCityNorm && searchCityNorm === candidateCityNorm) {
    signals.push({
      type: 'CITY_MATCH',
      points: WEIGHTS.CITY_MATCH,
      description: 'City matches',
      isStrong: false,
    });
    score += WEIGHTS.CITY_MATCH;
  }

  // Region match (only if city didn't match)
  else if (searchRegionNorm && candidateRegionNorm && searchRegionNorm === candidateRegionNorm) {
    signals.push({
      type: 'REGION_MATCH',
      points: WEIGHTS.REGION_MATCH,
      description: 'Region matches',
      isStrong: false,
    });
    score += WEIGHTS.REGION_MATCH;
  }

  // ============================================
  // GENERATE MATCH REASON AND SUGGESTED ACTION
  // ============================================

  const matchReason = generateMatchReason(signals, penalties, hasStrongMatch);
  const suggestedAction = generateSuggestedAction(score, hasStrongMatch, search);

  // Cap score at 100
  const rawScore = score;
  const finalScore = Math.max(0, Math.min(100, score));

  return {
    rawScore,
    score: finalScore,
    confidence: scoreToConfidence(finalScore),
    signals,
    penalties,
    hasStrongMatch,
    matchReason,
    suggestedAction,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateMatchReason(
  signals: MatchSignal[],
  penalties: MatchPenalty[],
  hasStrongMatch: boolean
): string {
  if (signals.length === 0) {
    return 'No matching information';
  }

  const strongSignals = signals.filter((s) => s.isStrong);
  const weakSignals = signals.filter((s) => !s.isStrong);

  const parts: string[] = [];

  // Strong signals first
  if (strongSignals.length > 0) {
    const types = strongSignals.map((s) => {
      if (s.type === 'PHONE_EXACT') return 'Phone';
      if (s.type === 'EMAIL_EXACT') return 'Email';
      if (s.type === 'FACEBOOK_EXACT') return 'Facebook';
      return s.type;
    });
    parts.push(types.join(' + ') + ' match');
  }

  // Add name if it matched
  const nameSignal = weakSignals.find((s) => s.type.startsWith('NAME'));
  if (nameSignal) {
    if (strongSignals.length > 0) {
      parts.push('name confirmed');
    } else {
      parts.push('Name similarity only');
    }
  }

  // Location
  const locationSignal = weakSignals.find((s) => s.type === 'CITY_MATCH' || s.type === 'REGION_MATCH');
  if (locationSignal && !hasStrongMatch) {
    parts.push(locationSignal.type === 'CITY_MATCH' ? 'same city' : 'same region');
  }

  // Penalties
  if (penalties.length > 0) {
    const nameMismatch = penalties.find((p) => p.type === 'NAME_MISMATCH');
    if (nameMismatch) {
      parts.push('(name differs)');
    }
  }

  return parts.join(', ') || 'Partial match';
}

function generateSuggestedAction(
  score: number,
  hasStrongMatch: boolean,
  search: SearchInput
): string | undefined {
  const confidence = scoreToConfidence(score);

  if (confidence === 'CONFIRMED' || confidence === 'HIGH') {
    return undefined; // No action needed
  }

  // Suggest adding strong identifiers if not provided
  const missingStrong: string[] = [];
  if (!search.phone) missingStrong.push('phone number');
  if (!search.email) missingStrong.push('email');
  if (!search.facebook) missingStrong.push('Facebook profile');

  if (missingStrong.length > 0) {
    if (confidence === 'MEDIUM') {
      return `Add ${missingStrong[0]} to confirm identity`;
    }
    if (confidence === 'LOW' || confidence === 'NONE') {
      return `Add ${missingStrong.slice(0, 2).join(' or ')} for accurate matching`;
    }
  }

  if (hasStrongMatch && confidence === 'MEDIUM') {
    return 'Verify name spelling to confirm';
  }

  return 'Add more identifying information';
}

// ============================================
// BATCH SCORING
// ============================================

/**
 * Score multiple candidates and return sorted results
 * 
 * @param search - The search criteria
 * @param candidates - List of potential matches
 * @param options - Filtering options
 * @returns Sorted list of matches with scores
 */
export function scoreAndRankCandidates(
  search: SearchInput,
  candidates: CandidateData[],
  options: {
    minScore?: number;
    maxResults?: number;
    requireStrongMatch?: boolean;
  } = {}
): Array<CandidateData & { match: MatchResult }> {
  const {
    minScore = 0,
    maxResults = 50,
    requireStrongMatch = false,
  } = options;

  // Score all candidates
  const scored = candidates
    .map((candidate) => ({
      ...candidate,
      match: calculateMatchScore(search, candidate),
    }))
    .filter((c) => {
      // Apply filters
      if (c.match.score < minScore) return false;
      if (requireStrongMatch && !c.match.hasStrongMatch) return false;
      return true;
    })
    // Sort by score descending
    .sort((a, b) => b.match.score - a.match.score)
    // Limit results
    .slice(0, maxResults);

  // Apply penalty for multiple weak matches (name-only search)
  const hasNoStrongIdentifiers = !search.phone && !search.email && !search.facebook;
  if (hasNoStrongIdentifiers && scored.length > 1) {
    // Cap confidence for name-only searches with multiple matches
    scored.forEach((result) => {
      if (!result.match.hasStrongMatch && result.match.score > 55) {
        result.match.penalties.push({
          type: 'MULTIPLE_WEAK_MATCHES',
          points: 0,
          description: 'Multiple potential matches found - add identifier to confirm',
        });
        // Don't reduce score, but update suggestion
        result.match.suggestedAction = 'Multiple matches found - add phone/email to identify';
      }
    });
  }

  return scored;
}

// ============================================
// POLICY ENFORCEMENT
// ============================================

/**
 * Apply business rules to match results
 * 
 * Rules:
 * 1. Never show "Match Found" on name-only searches
 * 2. Only show "High/Confirmed" if strong identifier matches
 * 3. Force "Add more info" if conflict detected
 */
export function enforceMatchPolicy(
  result: MatchResult,
  hasStrongInput: boolean
): {
  displayConfidence: ConfidenceLevel;
  displayLabel: string;
  showDetails: boolean;
  requiresConfirmation: boolean;
} {
  const hasConflict = result.penalties.some((p) => p.type === 'NAME_MISMATCH');

  // Rule 1 & 2: Name-only searches can never be "Confirmed" or "High"
  if (!hasStrongInput && !result.hasStrongMatch) {
    return {
      displayConfidence: result.confidence === 'CONFIRMED' || result.confidence === 'HIGH'
        ? 'MEDIUM'
        : result.confidence,
      displayLabel: 'Possible Match',
      showDetails: false,
      requiresConfirmation: true,
    };
  }

  // Rule 3: Conflicts require confirmation
  if (hasConflict) {
    return {
      displayConfidence: 'MEDIUM',
      displayLabel: 'Identifier Match (Name Differs)',
      showDetails: true,
      requiresConfirmation: true,
    };
  }

  // Normal case
  return {
    displayConfidence: result.confidence,
    displayLabel: confidenceToLabel(result.confidence),
    showDetails: result.confidence === 'CONFIRMED' || result.confidence === 'HIGH',
    requiresConfirmation: result.confidence === 'MEDIUM' || result.confidence === 'LOW',
  };
}
