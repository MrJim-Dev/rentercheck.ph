/**
 * String similarity utilities for fuzzy name matching
 * 
 * Implements Jaro-Winkler and related algorithms for
 * comparing names with typos, missing parts, etc.
 */

// ============================================
// JARO SIMILARITY
// ============================================

/**
 * Calculate Jaro similarity between two strings
 * Returns a value between 0 (no similarity) and 1 (exact match)
 */
export function jaroSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  // Count transpositions
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro =
    (matches / s1.length +
      matches / s2.length +
      (matches - transpositions / 2) / matches) /
    3;

  return jaro;
}

// ============================================
// JARO-WINKLER SIMILARITY
// ============================================

/**
 * Calculate Jaro-Winkler similarity between two strings
 * Gives higher scores to strings that match from the beginning
 * 
 * @param s1 First string
 * @param s2 Second string
 * @param prefixScale Scaling factor for common prefix (default 0.1)
 * @returns Similarity score between 0 and 1
 * 
 * @example
 * jaroWinklerSimilarity('juan', 'john') → ~0.78
 * jaroWinklerSimilarity('juan dela cruz', 'juan de la cruz') → ~0.97
 */
export function jaroWinklerSimilarity(
  s1: string,
  s2: string,
  prefixScale: number = 0.1
): number {
  const jaro = jaroSimilarity(s1, s2);

  // Find common prefix (max 4 characters per Winkler)
  let prefix = 0;
  const maxPrefix = Math.min(4, Math.min(s1.length, s2.length));

  for (let i = 0; i < maxPrefix; i++) {
    if (s1[i] === s2[i]) {
      prefix++;
    } else {
      break;
    }
  }

  return jaro + prefix * prefixScale * (1 - jaro);
}

// ============================================
// LEVENSHTEIN DISTANCE
// ============================================

/**
 * Calculate Levenshtein (edit) distance between two strings
 * Returns the minimum number of edits (insertions, deletions, substitutions)
 * needed to transform s1 into s2
 */
export function levenshteinDistance(s1: string, s2: string): number {
  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const matrix: number[][] = [];

  // Initialize first column
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }

  // Initialize first row
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[s1.length][s2.length];
}

/**
 * Calculate Levenshtein similarity (normalized between 0 and 1)
 */
export function levenshteinSimilarity(s1: string, s2: string): number {
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(s1, s2) / maxLen;
}

// ============================================
// TOKEN-BASED SIMILARITY
// ============================================

/**
 * Calculate token set similarity (bag-of-words comparison)
 * Useful for names where word order may vary
 * 
 * @example
 * tokenSetSimilarity('juan dela cruz', 'cruz juan dela') → 1.0
 * tokenSetSimilarity('juan cruz', 'juan dela cruz') → ~0.67
 */
export function tokenSetSimilarity(s1: string, s2: string): number {
  const tokens1 = new Set(s1.toLowerCase().split(/\s+/).filter(Boolean));
  const tokens2 = new Set(s2.toLowerCase().split(/\s+/).filter(Boolean));

  if (tokens1.size === 0 && tokens2.size === 0) return 1;
  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersection = 0;
  for (const token of tokens1) {
    if (tokens2.has(token)) {
      intersection++;
    }
  }

  // Jaccard similarity
  const union = tokens1.size + tokens2.size - intersection;
  return intersection / union;
}

/**
 * Calculate token sort similarity
 * Sorts tokens alphabetically before comparing
 * 
 * @example
 * tokenSortSimilarity('juan dela cruz', 'cruz dela juan') → 1.0
 */
export function tokenSortSimilarity(s1: string, s2: string): number {
  const sorted1 = s1
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ');
  const sorted2 = s2
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ');

  return jaroWinklerSimilarity(sorted1, sorted2);
}

// ============================================
// NAME-SPECIFIC SIMILARITY
// ============================================

/**
 * Calculate comprehensive name similarity using multiple methods
 * Returns the best score from various comparison strategies
 * 
 * Strategies used:
 * 1. Full string Jaro-Winkler
 * 2. Token set similarity
 * 3. Token sort similarity
 * 4. First + Last name comparison
 * 
 * @returns Score between 0 and 1
 */
export function nameSimilarity(name1: string, name2: string): number {
  if (!name1 || !name2) return 0;

  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();

  if (n1 === n2) return 1;

  // Strategy 1: Full Jaro-Winkler
  const fullJW = jaroWinklerSimilarity(n1, n2);

  // Strategy 2: Token set similarity
  const tokenSet = tokenSetSimilarity(n1, n2);

  // Strategy 3: Token sort similarity
  const tokenSort = tokenSortSimilarity(n1, n2);

  // Strategy 4: First + Last name only
  const parts1 = n1.split(/\s+/).filter(Boolean);
  const parts2 = n2.split(/\s+/).filter(Boolean);

  let firstLastScore = 0;
  if (parts1.length > 0 && parts2.length > 0) {
    const first1 = parts1[0];
    const last1 = parts1[parts1.length - 1];
    const first2 = parts2[0];
    const last2 = parts2[parts2.length - 1];

    // Compare first names
    const firstScore = jaroWinklerSimilarity(first1, first2);

    // Compare last names
    const lastScore = jaroWinklerSimilarity(last1, last2);

    // Weight: first name slightly more important
    firstLastScore = firstScore * 0.45 + lastScore * 0.55;
  }

  // Return the maximum score across all strategies
  return Math.max(fullJW, tokenSet, tokenSort, firstLastScore);
}

/**
 * Determine if two names are likely the same person
 * based on similarity threshold
 */
export function areNamesSimilar(
  name1: string,
  name2: string,
  threshold: number = 0.85
): { similar: boolean; score: number; confidence: 'exact' | 'high' | 'medium' | 'low' } {
  const score = nameSimilarity(name1, name2);

  let confidence: 'exact' | 'high' | 'medium' | 'low';
  if (score >= 0.98) {
    confidence = 'exact';
  } else if (score >= 0.92) {
    confidence = 'high';
  } else if (score >= 0.85) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    similar: score >= threshold,
    score,
    confidence,
  };
}

// ============================================
// PARTIAL MATCHING UTILITIES
// ============================================

/**
 * Check if one string contains the other as a significant substring
 * Useful for partial name matching
 */
export function containsSignificant(longer: string, shorter: string, minLength: number = 3): boolean {
  if (shorter.length < minLength) return false;

  const l = longer.toLowerCase();
  const s = shorter.toLowerCase();

  return l.includes(s);
}

/**
 * Calculate how much of the shorter string is contained in the longer
 */
export function containmentRatio(s1: string, s2: string): number {
  const longer = s1.length >= s2.length ? s1.toLowerCase() : s2.toLowerCase();
  const shorter = s1.length < s2.length ? s1.toLowerCase() : s2.toLowerCase();

  if (shorter.length === 0) return 0;

  // Find the longest common substring
  let maxLen = 0;
  for (let i = 0; i < shorter.length; i++) {
    for (let j = i + 1; j <= shorter.length; j++) {
      const sub = shorter.substring(i, j);
      if (longer.includes(sub) && sub.length > maxLen) {
        maxLen = sub.length;
      }
    }
  }

  return maxLen / shorter.length;
}

// ============================================
// SOUNDEX (English phonetic algorithm)
// ============================================

/**
 * Generate Soundex code for a string
 * Useful for matching names that sound similar
 * 
 * Note: Soundex works better for English names
 * Filipino names may need a custom algorithm
 */
export function soundex(s: string): string {
  const str = s.toUpperCase().replace(/[^A-Z]/g, '');
  if (str.length === 0) return '0000';

  const codes: Record<string, string> = {
    B: '1', F: '1', P: '1', V: '1',
    C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2',
    D: '3', T: '3',
    L: '4',
    M: '5', N: '5',
    R: '6',
  };

  let result = str[0];
  let prevCode = codes[str[0]] || '';

  for (let i = 1; i < str.length && result.length < 4; i++) {
    const code = codes[str[i]];
    if (code && code !== prevCode) {
      result += code;
      prevCode = code;
    } else if (!code) {
      prevCode = '';
    }
  }

  return (result + '0000').slice(0, 4);
}

/**
 * Check if two strings have the same Soundex code
 */
export function soundsLike(s1: string, s2: string): boolean {
  return soundex(s1) === soundex(s2);
}
