/**
 * Normalization utilities for renter identifiers
 * 
 * These functions normalize inputs to prevent fake mismatches
 * and ensure consistent matching across the database.
 */

// ============================================
// PHONE NORMALIZATION (Philippine format)
// ============================================

/**
 * Normalize Philippine phone numbers to E.164-ish format
 * Handles: +63, 63, 0 prefixes → stores as +63XXXXXXXXXX
 * 
 * @example
 * normalizePhone('+63 912 345 6789') → '+639123456789'
 * normalizePhone('0912-345-6789') → '+639123456789'
 * normalizePhone('639123456789') → '+639123456789'
 * normalizePhone('09123456789') → '+639123456789'
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // If starts with +, remove it but remember we had it
  const hadPlus = cleaned.startsWith('+');
  if (hadPlus) {
    cleaned = cleaned.slice(1);
  }

  // Now we have only digits
  // Handle different formats:
  // 639XXXXXXXXX (12 digits) - already has country code without +
  // 09XXXXXXXXX (11 digits) - local format with 0
  // 9XXXXXXXXX (10 digits) - just the number

  if (cleaned.length === 12 && cleaned.startsWith('63')) {
    // Already in 63XXXXXXXXX format
    return `+${cleaned}`;
  }

  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    // Local format: 09XXXXXXXXX → +639XXXXXXXXX
    return `+63${cleaned.slice(1)}`;
  }

  if (cleaned.length === 10 && cleaned.startsWith('9')) {
    // Just the mobile number: 9XXXXXXXXX → +639XXXXXXXXX
    return `+63${cleaned}`;
  }

  // If it's already formatted with +63 prefix
  if (hadPlus && cleaned.length === 12 && cleaned.startsWith('63')) {
    return `+${cleaned}`;
  }

  // For landlines or other formats, just prefix with +63 if it looks valid
  if (cleaned.length >= 7 && cleaned.length <= 12) {
    // Check if it might be a landline (area code + number)
    if (!cleaned.startsWith('63')) {
      return `+63${cleaned}`;
    }
    return `+${cleaned}`;
  }

  // Return cleaned version for non-standard formats
  // This allows partial matching later
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Extract last N digits of a phone number for partial matching
 */
export function getPhoneLastDigits(phone: string | null | undefined, count: number = 4): string | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  const digitsOnly = normalized.replace(/\D/g, '');
  if (digitsOnly.length < count) return null;

  return digitsOnly.slice(-count);
}

/**
 * Generate all possible phone formats for matching
 * This helps match "09454279198" with "+639454279198", "9454279198", etc.
 */
export function getPhoneVariations(phone: string | null | undefined): string[] {
  if (!phone) return [];
  
  const variations: string[] = [];
  
  // Get digits only
  let digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return [];
  
  // If starts with 63, it's already country code
  if (digits.startsWith('63') && digits.length === 12) {
    const local = digits.slice(2); // 9XXXXXXXXX
    variations.push(`+${digits}`);           // +639XXXXXXXXX
    variations.push(digits);                 // 639XXXXXXXXX
    variations.push(`0${local}`);            // 09XXXXXXXXX
    variations.push(local);                  // 9XXXXXXXXX
    variations.push(local.slice(-7));        // Last 7 digits
    variations.push(local.slice(-10));       // Last 10 digits
  } 
  // If starts with 0, it's local format
  else if (digits.startsWith('0') && digits.length === 11) {
    const mobile = digits.slice(1); // 9XXXXXXXXX
    variations.push(`+63${mobile}`);         // +639XXXXXXXXX
    variations.push(`63${mobile}`);          // 639XXXXXXXXX
    variations.push(digits);                 // 09XXXXXXXXX
    variations.push(mobile);                 // 9XXXXXXXXX
    variations.push(mobile.slice(-7));       // Last 7 digits
  }
  // If starts with 9 and is 10 digits, it's mobile without prefix
  else if (digits.startsWith('9') && digits.length === 10) {
    variations.push(`+63${digits}`);         // +639XXXXXXXXX
    variations.push(`63${digits}`);          // 639XXXXXXXXX
    variations.push(`0${digits}`);           // 09XXXXXXXXX
    variations.push(digits);                 // 9XXXXXXXXX
    variations.push(digits.slice(-7));       // Last 7 digits
  }
  // Otherwise, just use what we have
  else {
    variations.push(digits);
    if (digits.length >= 7) {
      variations.push(digits.slice(-7));
    }
    if (digits.length >= 10) {
      variations.push(digits.slice(-10));
    }
  }
  
  // Remove duplicates and empty strings
  return [...new Set(variations.filter(v => v.length > 0))];
}

// ============================================
// EMAIL NORMALIZATION
// ============================================

/**
 * Normalize email addresses
 * - Lowercase
 * - Trim whitespace
 * - Remove dots from Gmail local part (optional, for stricter matching)
 * 
 * @example
 * normalizeEmail('  John.Doe@Gmail.COM  ') → 'john.doe@gmail.com'
 */
export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;

  const normalized = email.trim().toLowerCase();

  // Basic validation
  if (!normalized.includes('@') || normalized.length < 5) {
    return null;
  }

  return normalized;
}

/**
 * Normalize email with Gmail dot-removal for stricter matching
 * Gmail ignores dots in the local part, so john.doe@gmail.com = johndoe@gmail.com
 */
export function normalizeEmailStrict(email: string | null | undefined): string | null {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const [localPart, domain] = normalized.split('@');
  if (!localPart || !domain) return normalized;

  // For Gmail, remove dots from local part
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    // Also remove anything after + (Gmail allows user+tag@gmail.com)
    const cleanLocal = localPart.split('+')[0].replace(/\./g, '');
    return `${cleanLocal}@${domain}`;
  }

  return normalized;
}

// ============================================
// FACEBOOK URL NORMALIZATION
// ============================================

/**
 * Normalize Facebook profile URLs to a canonical format
 * Strips parameters, normalizes domain, extracts username/ID
 * 
 * @example
 * normalizeFacebookUrl('https://www.facebook.com/john.doe?ref=123') → 'facebook.com/john.doe'
 * normalizeFacebookUrl('fb.com/profile.php?id=123456') → 'facebook.com/123456'
 * normalizeFacebookUrl('https://m.facebook.com/john.doe') → 'facebook.com/john.doe'
 */
export function normalizeFacebookUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  let normalized = url.trim().toLowerCase();

  // If it's just a username/ID without URL
  if (!normalized.includes('facebook.com') && !normalized.includes('fb.com')) {
    // Check if it looks like a Facebook username or ID
    if (/^[a-z0-9.]+$/i.test(normalized) || /^\d+$/.test(normalized)) {
      return `facebook.com/${normalized}`;
    }
    return null;
  }

  // Remove protocol
  normalized = normalized.replace(/^https?:\/\//, '');

  // Remove www., m., mobile., etc.
  normalized = normalized.replace(/^(www\.|m\.|mobile\.|touch\.)?/, '');

  // Normalize fb.com to facebook.com
  normalized = normalized.replace(/^fb\.com/, 'facebook.com');

  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, '');

  // Handle profile.php?id=XXXXX format
  const profileIdMatch = normalized.match(/facebook\.com\/profile\.php\?id=(\d+)/);
  if (profileIdMatch) {
    return `facebook.com/${profileIdMatch[1]}`;
  }

  // Remove query parameters
  const urlWithoutParams = normalized.split('?')[0];

  // Extract the path (username or ID)
  const match = urlWithoutParams.match(/facebook\.com\/([a-z0-9.]+)/i);
  if (match && match[1]) {
    // Ignore common Facebook paths that aren't profiles
    const ignorePaths = ['pages', 'groups', 'events', 'marketplace', 'watch', 'gaming', 'stories'];
    if (ignorePaths.includes(match[1])) {
      return null;
    }
    return `facebook.com/${match[1]}`;
  }

  return null;
}

/**
 * Extract Facebook username or ID from a normalized URL
 */
export function extractFacebookId(url: string | null | undefined): string | null {
  const normalized = normalizeFacebookUrl(url);
  if (!normalized) return null;

  const match = normalized.match(/facebook\.com\/(.+)/);
  return match ? match[1] : null;
}

// ============================================
// NAME NORMALIZATION
// ============================================

/**
 * Normalize names for matching
 * - Lowercase
 * - Trim and collapse multiple spaces
 * - Remove punctuation (except hyphens in names)
 * - Handle common variations (Jr, Sr, II, III, etc.)
 * 
 * @example
 * normalizeName('  Juan   Dela Cruz, Jr.  ') → 'juan dela cruz jr'
 * normalizeName("Ma. Christina Santos") → 'ma christina santos'
 */
export function normalizeName(name: string | null | undefined): string | null {
  if (!name) return null;

  let normalized = name.trim().toLowerCase();

  // Replace multiple spaces with single space
  normalized = normalized.replace(/\s+/g, ' ');

  // Remove common punctuation but keep hyphens and spaces
  // Filipino names often have "Ma." for Maria, "Mc" for Mac, etc.
  normalized = normalized.replace(/[.,'"!?()]/g, '');

  // Normalize common suffixes
  normalized = normalized.replace(/\s+jr$/i, ' jr');
  normalized = normalized.replace(/\s+sr$/i, ' sr');
  normalized = normalized.replace(/\s+ii$/i, ' ii');
  normalized = normalized.replace(/\s+iii$/i, ' iii');
  normalized = normalized.replace(/\s+iv$/i, ' iv');

  // Remove extra spaces again after replacements
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized.length > 0 ? normalized : null;
}

/**
 * Split name into parts for more flexible matching
 * Returns: { first, middle, last, suffix, full }
 */
export function parseNameParts(name: string | null | undefined): {
  first: string | null;
  middle: string | null;
  last: string | null;
  suffix: string | null;
  full: string | null;
  tokens: string[];
} {
  const normalized = normalizeName(name);
  if (!normalized) {
    return { first: null, middle: null, last: null, suffix: null, full: null, tokens: [] };
  }

  const parts = normalized.split(' ');

  // Check for suffix at end
  const suffixes = ['jr', 'sr', 'ii', 'iii', 'iv', 'v'];
  let suffix: string | null = null;
  if (parts.length > 1 && suffixes.includes(parts[parts.length - 1])) {
    suffix = parts.pop() || null;
  }

  // Now split remaining parts
  const first = parts[0] || null;
  const last = parts.length > 1 ? parts[parts.length - 1] : null;
  const middle = parts.length > 2 ? parts.slice(1, -1).join(' ') : null;

  return {
    first,
    middle,
    last,
    suffix,
    full: normalized,
    tokens: parts,
  };
}

/**
 * Get first and last name only (ignoring middle)
 * Useful for comparing names when middle names vary
 */
export function getFirstLastName(name: string | null | undefined): string | null {
  const parts = parseNameParts(name);
  if (!parts.first) return null;

  if (parts.last && parts.first !== parts.last) {
    return `${parts.first} ${parts.last}`;
  }
  return parts.first;
}

// ============================================
// LOCATION NORMALIZATION
// ============================================

/**
 * Common city/province name variations in the Philippines
 */
const LOCATION_ALIASES: Record<string, string> = {
  // NCR variations
  'ncr': 'metro manila',
  'national capital region': 'metro manila',
  'mm': 'metro manila',
  'manila': 'manila',
  'qc': 'quezon city',
  'quezon': 'quezon city',
  'makati city': 'makati',
  'pasig city': 'pasig',
  'taguig city': 'taguig',
  'mandaluyong city': 'mandaluyong',
  'paranaque city': 'paranaque',
  'las pinas city': 'las pinas',
  'muntinlupa city': 'muntinlupa',
  'marikina city': 'marikina',
  'san juan city': 'san juan',
  'caloocan city': 'caloocan',
  'malabon city': 'malabon',
  'navotas city': 'navotas',
  'valenzuela city': 'valenzuela',
  'pasay city': 'pasay',
  // Common province variations
  'bulacan': 'bulacan',
  'cavite': 'cavite',
  'laguna': 'laguna',
  'rizal': 'rizal',
  'pampanga': 'pampanga',
  'batangas': 'batangas',
  'cebu': 'cebu',
  'cebu city': 'cebu city',
  'davao': 'davao',
  'davao city': 'davao city',
};

/**
 * Normalize location names for matching
 */
export function normalizeLocation(location: string | null | undefined): string | null {
  if (!location) return null;

  let normalized = location.trim().toLowerCase();

  // Remove common words
  normalized = normalized
    .replace(/\bcity\b/g, '')
    .replace(/\bprovince\b/g, '')
    .replace(/\bmunicipality\b/g, '')
    .replace(/\bbarangay\b/g, '')
    .replace(/\bbrgy\b/g, '')
    .trim()
    .replace(/\s+/g, ' ');

  // Check aliases
  if (LOCATION_ALIASES[normalized]) {
    return LOCATION_ALIASES[normalized];
  }

  return normalized.length > 0 ? normalized : null;
}

// ============================================
// HASH GENERATION (for privacy)
// ============================================

/**
 * Create a simple hash of a normalized identifier
 * For privacy-preserving storage of strong identifiers
 * 
 * Note: In production, use a proper cryptographic hash with salt
 */
export function hashIdentifier(value: string): string {
  // Simple hash for demo purposes
  // In production, use crypto.subtle.digest or bcrypt
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// ============================================
// UTILITY EXPORTS
// ============================================

export type IdentifierType = 'PHONE' | 'EMAIL' | 'FACEBOOK' | 'GOVT_ID' | 'NAME';

/**
 * Normalize date of birth to YYYY-MM-DD format
 * Handles multiple input formats: MM/DD/YYYY, DD-MM-YYYY, YYYY-MM-DD, etc.
 * 
 * @example
 * normalizeDateOfBirth('01/15/1990') → '1990-01-15'
 * normalizeDateOfBirth('15-01-1990') → '1990-01-15'
 * normalizeDateOfBirth('1990-01-15') → '1990-01-15'
 */
export function normalizeDateOfBirth(date: string | null | undefined): string | null {
  if (!date) return null;
  
  const trimmed = date.trim();
  if (!trimmed) return null;
  
  // Try to parse the date
  let parsedDate: Date | null = null;
  
  // Check if it's already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    parsedDate = new Date(trimmed);
  }
  // Check for MM/DD/YYYY or M/D/YYYY format
  else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const parts = trimmed.split('/');
    parsedDate = new Date(`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`);
  }
  // Check for DD-MM-YYYY or D-M-YYYY format
  else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
    const parts = trimmed.split('-');
    // Assume DD-MM-YYYY format
    parsedDate = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
  }
  // Check for YYYY/MM/DD format
  else if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(trimmed)) {
    const parts = trimmed.split('/');
    parsedDate = new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`);
  }
  // Try direct Date parsing as fallback
  else {
    parsedDate = new Date(trimmed);
  }
  
  // Validate the date
  if (!parsedDate || isNaN(parsedDate.getTime())) {
    return null;
  }
  
  // Return in YYYY-MM-DD format
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Normalize any identifier based on its type
 */
export function normalizeIdentifier(
  type: IdentifierType,
  value: string | null | undefined
): string | null {
  switch (type) {
    case 'PHONE':
      return normalizePhone(value);
    case 'EMAIL':
      return normalizeEmail(value);
    case 'FACEBOOK':
      return normalizeFacebookUrl(value);
    case 'NAME':
      return normalizeName(value);
    case 'GOVT_ID':
      // For govt IDs, just clean up whitespace and uppercase
      return value ? value.trim().toUpperCase().replace(/\s+/g, '') : null;
    default:
      return value?.trim() || null;
  }
}
