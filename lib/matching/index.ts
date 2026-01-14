/**
 * Renter Matching Module
 * 
 * Provides utilities for normalizing identifiers, calculating match confidence,
 * and searching for renters in the database.
 */

// Normalizers
export {
  normalizePhone,
  normalizeEmail,
  normalizeEmailStrict,
  normalizeFacebookUrl,
  extractFacebookId,
  normalizeName,
  parseNameParts,
  getFirstLastName,
  normalizeLocation,
  normalizeIdentifier,
  getPhoneLastDigits,
  hashIdentifier,
  type IdentifierType,
} from './normalizers';

// Similarity functions
export {
  jaroSimilarity,
  jaroWinklerSimilarity,
  levenshteinDistance,
  levenshteinSimilarity,
  tokenSetSimilarity,
  tokenSortSimilarity,
  nameSimilarity,
  areNamesSimilar,
  containsSignificant,
  containmentRatio,
  soundex,
  soundsLike,
} from './similarity';

// Scoring
export {
  calculateMatchScore,
  scoreToConfidence,
  confidenceToLabel,
  scoreAndRankCandidates,
  enforceMatchPolicy,
  type ConfidenceLevel,
  type MatchSignalType,
  type MatchSignal,
  type MatchPenalty,
  type MatchResult,
  type SearchInput,
  type CandidateData,
} from './scoring';

// Types
export type {
  SearchQuery,
  SearchFilters,
  SearchResultRenter,
  SearchResultMatch,
  SearchResponse,
  RenterIncidentSummary,
  RenterProfileDetailed,
  RenterRow,
  IdentifierRow,
  IncidentRow,
  PublicRenterView,
  PublicIncidentView,
} from './types';
