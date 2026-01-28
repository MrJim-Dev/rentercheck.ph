"use server";

import { gateComplexSearch } from "@/lib/credits/search-gatekeeper";
import {
  enforceMatchPolicy,
  extractFacebookId,
  getPhoneVariations,
  normalizeEmail,
  normalizeEmailStrict,
  normalizeFacebookUrl,
  normalizeName,
  normalizeDateOfBirth,
  normalizePhone,
  scoreAndRankCandidates,
  nameSimilarity,
  type CandidateData,
  type SearchFilters,
  type SearchInput,
  type SearchQuery,
  type SearchResponse,
  type SearchResultMatch,
} from "@/lib/matching";
import { createClient } from "@/lib/supabase/server";

// ============================================
// SEARCH FUNCTIONS
// ============================================

/**
 * Detect the type of a single identifier string
 */
function detectIdentifierType(value: string): 'email' | 'phone' | 'facebook' | 'date' | 'name' {
  const trimmed = value.trim();

  // Check for date pattern (various formats)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed) ||  // YYYY-MM-DD
      /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed) ||  // MM/DD/YYYY
      /^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {  // DD-MM-YYYY
    return 'date';
  }

  // Check for email pattern
  if (trimmed.includes("@") && trimmed.includes(".")) {
    return 'email';
  }

  // Check for Facebook URL pattern
  if (
    trimmed.includes("facebook.com") ||
    trimmed.includes("fb.com") ||
    trimmed.startsWith("fb:") ||
    trimmed.toLowerCase().startsWith("fb/")
  ) {
    return 'facebook';
  }

  // Check for phone pattern
  const digitsOnly = trimmed.replace(/[\s\-()]/g, "");
  const digitCount = (trimmed.match(/\d/g) || []).length;

  // If it starts with phone prefixes or is mostly digits
  if (
    trimmed.startsWith("+") ||
    trimmed.startsWith("09") ||
    trimmed.startsWith("63") ||
    (digitsOnly.match(/^\d+$/) && digitsOnly.length >= 7) ||
    (digitCount >= 7 && digitCount / trimmed.replace(/\s/g, '').length > 0.6)
  ) {
    return 'phone';
  }

  // Default to name
  return 'name';
}

/**
 * Parse a free-text query to extract multiple identifiers
 * Supports input like: "John Doe, 094554343445, johndoe@example.com, 1990-01-15"
 * Intelligently detects and categorizes each part
 */
function parseSearchQuery(query: string): SearchInput {
  const trimmed = query.trim();

  // Split by common delimiters: comma, semicolon, pipe, or newline
  // But be careful not to split phone numbers with dashes
  const parts = trimmed
    .split(/[,;|\n]+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // If only one part, use simple detection
  if (parts.length === 1) {
    const type = detectIdentifierType(parts[0]);
    switch (type) {
      case 'email':
        return { email: parts[0] };
      case 'phone':
        return { phone: parts[0] };
      case 'facebook':
        return { facebook: parts[0].replace(/^fb:/i, "") };
      case 'date':
        return { dateOfBirth: parts[0] };
      default:
        return { name: parts[0] };
    }
  }

  // Multiple parts - categorize each one
  const result: SearchInput = {};
  const names: string[] = [];
  const phones: string[] = [];
  const emails: string[] = [];
  const facebooks: string[] = [];
  let dateOfBirth: string | null = null;

  for (const part of parts) {
    const type = detectIdentifierType(part);
    switch (type) {
      case 'email':
        emails.push(part);
        break;
      case 'phone':
        phones.push(part);
        break;
      case 'facebook':
        facebooks.push(part.replace(/^fb:/i, ""));
        break;
      case 'date':
        if (!dateOfBirth) dateOfBirth = part; // Only use first date found
        break;
      case 'name':
        names.push(part);
        break;
    }
  }

  // Use the first of each type as the primary, but we'll use all for matching
  if (names.length > 0) {
    // Combine multiple name parts if they look like parts of the same name
    // e.g., "Juan" and "Dela Cruz" could be "Juan Dela Cruz"
    result.name = names.join(' ');
  }
  if (phones.length > 0) {
    result.phone = phones[0];
    // Store additional phones for extended matching
    if (phones.length > 1) {
      result.additionalPhones = phones.slice(1);
    }
  }
  if (emails.length > 0) {
    result.email = emails[0];
    if (emails.length > 1) {
      result.additionalEmails = emails.slice(1);
    }
  }
  if (facebooks.length > 0) {
    result.facebook = facebooks[0];
    if (facebooks.length > 1) {
      result.additionalFacebooks = facebooks.slice(1);
    }
  }
  if (dateOfBirth) {
    result.dateOfBirth = dateOfBirth;
  }

  return result;
}

/**
 * Mask a name for privacy (e.g., "Juan Dela Cruz" → "J*** D*** C***")
 */
function maskName(name: string): string {
  return name
    .split(" ")
    .map((part) => {
      if (part.length <= 1) return part;
      return part[0] + "*".repeat(Math.min(part.length - 1, 3));
    })
    .join(" ");
}

/**
 * Generate a fingerprint for unlinked incident reports
 * This creates a consistent identifier for reports not yet linked to a renter
 */
function generateReportFingerprint(reportId: string): string {
  // Use first 12 chars of UUID as fingerprint
  return `report-${reportId.slice(0, 12)}`;
}

/**
 * Get human-readable incident type label
 */
function getIncidentTypeLabel(type: string | null): string {
  const labels: Record<string, string> = {
    NON_RETURN: "Non-return of item",
    UNPAID_BALANCE: "Unpaid balance",
    LATE_PAYMENT: "Late payments",
    SCAM: "Scam / Fraud",
    DAMAGE_DISPUTE: "Damage dispute",
    PROPERTY_DAMAGE: "Property damage",
    CONTRACT_VIOLATION: "Contract violation",
    FAKE_INFO: "Fake information",
    NO_SHOW: "No-show / Ghosting",
    ABUSIVE_BEHAVIOR: "Abusive behavior",
    THREATS_HARASSMENT: "Threats / Harassment",
    OTHER: "Other issue",
  };
  return labels[type || ''] || type || 'Unknown';
}

/**
 * Get human-readable rental category label
 */
function getCategoryLabel(category: string | null): string {
  const labels: Record<string, string> = {
    CAMERA_EQUIPMENT: "Camera & Photography",
    CLOTHING_FASHION: "Clothing & Fashion",
    ELECTRONICS_GADGETS: "Electronics & Gadgets",
    VEHICLE_CAR: "Car",
    VEHICLE_MOTORCYCLE: "Motorcycle",
    VEHICLE_BICYCLE: "Bicycle / E-bike",
    REAL_ESTATE_CONDO: "Condo / Apartment",
    REAL_ESTATE_HOUSE: "House",
    REAL_ESTATE_ROOM: "Room / Bedspace",
    FURNITURE_APPLIANCES: "Furniture & Appliances",
    EVENTS_PARTY: "Events & Party",
    TOOLS_EQUIPMENT: "Tools & Equipment",
    SPORTS_OUTDOOR: "Sports & Outdoor",
    JEWELRY_ACCESSORIES: "Jewelry & Accessories",
    BABY_KIDS: "Baby & Kids",
    OTHER: "Other",
  };
  return labels[category || ''] || category || '';
}

/**
 * Search for renters matching the given query
 */
export async function searchRenters(
  queryOrInput: string | SearchQuery,
  filters: SearchFilters = {}
): Promise<SearchResponse> {
  const startTime = Date.now();
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  try {
    // Parse the query
    let searchInput: SearchInput;
    let originalQuery: SearchQuery;

    if (typeof queryOrInput === "string") {
      searchInput = parseSearchQuery(queryOrInput);
      // Convert nulls to undefined for SearchQuery type compatibility
      originalQuery = {
        query: queryOrInput,
        name: searchInput.name || undefined,
        phone: searchInput.phone || undefined,
        email: searchInput.email || undefined,
        facebook: searchInput.facebook || undefined,
        dateOfBirth: searchInput.dateOfBirth || undefined,
        city: searchInput.city || undefined,
        region: searchInput.region || undefined,
      };
    } else {
      originalQuery = queryOrInput;
      searchInput = {
        name: queryOrInput.name || undefined,
        phone: queryOrInput.phone || undefined,
        email: queryOrInput.email || undefined,
        facebook: queryOrInput.facebook || undefined,
        dateOfBirth: queryOrInput.dateOfBirth || undefined,
        city: queryOrInput.city || undefined,
        region: queryOrInput.region || undefined,
      };
    }

    // =================================================================
    // CREDIT CONSUMPTION GATE (COMPLEX SEARCH)
    // =================================================================
    if (isAuthenticated && user) {
      try {
        await gateComplexSearch(searchInput, user.id);
      } catch (error: any) {
        if (error.message === 'Insufficient credits' || error.message?.includes('Insufficient credits')) {
          return {
            success: false,
            results: [],
            totalCount: 0,
            query: originalQuery,
            error: "Insufficient credits. Refill for free to continue.",
            meta: {
              searchTime: 0,
              hasStrongInput: false,
              tips: []
            }
          };
        }
        console.error("Credit deduction failed:", error);
        // Decide if we want to block or continue on other errors. 
        // Usually safest to block if payment is strict.
        throw error;
      }
    }
    // =================================================================


    // Check if we have strong identifiers in the input
    const hasStrongInput = !!(
      searchInput.phone ||
      searchInput.email ||
      searchInput.facebook ||
      (searchInput.additionalPhones && searchInput.additionalPhones.length > 0) ||
      (searchInput.additionalEmails && searchInput.additionalEmails.length > 0) ||
      (searchInput.additionalFacebooks && searchInput.additionalFacebooks.length > 0)
    );

    // Normalize primary inputs for database search
    const phoneNorm = normalizePhone(searchInput.phone);
    const emailNorm = normalizeEmail(searchInput.email);
    const facebookNorm = normalizeFacebookUrl(searchInput.facebook);
    const nameNorm = normalizeName(searchInput.name);

    // Normalize additional identifiers
    const additionalPhonesNorm = (searchInput.additionalPhones || [])
      .map(p => normalizePhone(p))
      .filter((p): p is string => p !== null);
    const additionalEmailsNorm = (searchInput.additionalEmails || [])
      .map(e => normalizeEmail(e))
      .filter((e): e is string => e !== null);
    const additionalFacebooksNorm = (searchInput.additionalFacebooks || [])
      .map(f => normalizeFacebookUrl(f))
      .filter((f): f is string => f !== null);

    // Combine all normalized identifiers for comprehensive search
    const allPhonesNorm = [phoneNorm, ...additionalPhonesNorm].filter((p): p is string => p !== null);
    const allEmailsNorm = [emailNorm, ...additionalEmailsNorm].filter((e): e is string => e !== null);
    const allFacebooksNorm = [facebookNorm, ...additionalFacebooksNorm].filter((f): f is string => f !== null);

    // If no valid input, return empty
    if (!phoneNorm && !emailNorm && !facebookNorm && !nameNorm &&
      allPhonesNorm.length === 0 && allEmailsNorm.length === 0 && allFacebooksNorm.length === 0) {
      return {
        success: true,
        results: [],
        totalCount: 0,
        query: originalQuery,
        meta: {
          searchTime: Date.now() - startTime,
          hasStrongInput: false,
          tips: ["Enter a name, phone number, email, or Facebook URL to search"],
        },
      };
    }

    // Build the query for candidates
    // Strategy: 
    // 1. If strong identifier provided, search by that first
    // 2. Then search by name with fuzzy matching
    // 3. Also search in incident_reports for approved reports not yet linked to renters
    // 4. Combine and score all results

    const candidateIds = new Set<string>();
    const candidates: CandidateData[] = [];

    // Track incident report IDs for unlinked reports
    const unlinkedReportIds = new Set<string>();

    // Search by identifiers first (exact match on normalized values)
    if (phoneNorm || emailNorm || facebookNorm) {
      const identifierConditions = [];
      if (phoneNorm) identifierConditions.push(`identifier_normalized.eq.${phoneNorm}`);
      if (emailNorm) identifierConditions.push(`identifier_normalized.eq.${emailNorm}`);
      if (facebookNorm) identifierConditions.push(`identifier_normalized.eq.${facebookNorm}`);

      const { data: identifierMatches, error: identifierError } = await supabase
        .from("renter_identifiers")
        .select("renter_id, identifier_type, identifier_normalized, identifier_value")
        .or(identifierConditions.map(c => c.replace('identifier_normalized.eq.', 'identifier_normalized.eq.')).join(','));

      if (!identifierError && identifierMatches) {
        // Get unique renter IDs
        for (const match of identifierMatches) {
          if (match.renter_id) {
            candidateIds.add(match.renter_id);
          }
        }
      }
    }

    // Search by name if provided (using full-text search or ILIKE)
    if (nameNorm) {
      // Use PostgreSQL full-text search if available, or ILIKE fallback
      const { data: nameMatches, error: nameError } = await supabase
        .from("renters")
        .select("id")
        .or(`full_name_normalized.ilike.%${nameNorm}%,full_name.ilike.%${nameNorm}%`)
        .limit(100);

      if (!nameError && nameMatches) {
        for (const match of nameMatches) {
          candidateIds.add(match.id);
        }
      }
    }

    // If no candidates found via direct search, try partial name matching
    if (candidateIds.size === 0 && nameNorm) {
      // Try searching with just the first and last words (first/last name)
      const nameParts = nameNorm.split(" ").filter(Boolean);
      if (nameParts.length >= 2) {
        const firstName = nameParts[0];
        const lastName = nameParts[nameParts.length - 1];

        const { data: partialMatches } = await supabase
          .from("renters")
          .select("id")
          .or(`full_name_normalized.ilike.%${firstName}%,full_name_normalized.ilike.%${lastName}%`)
          .limit(100);

        if (partialMatches) {
          for (const match of partialMatches) {
            candidateIds.add(match.id);
          }
        }
      }
    }

    // ============================================
    // ALSO SEARCH INCIDENT_REPORTS DIRECTLY
    // For approved reports not yet linked to a renter
    // Uses multiple strategies: full-text search, ILIKE, and alias matching
    // ============================================

    // Search by name in incident_reports (multiple strategies)
    if (nameNorm) {
      // Strategy 1: Use PostgreSQL full-text search if available (search_vector)
      // This provides better fuzzy matching for names
      const searchTerms = nameNorm.split(' ').filter(t => t.length >= 2);
      if (searchTerms.length > 0) {
        const tsQuery = searchTerms.join(' & ');
        const { data: ftsMatches } = await supabase
          .from("incident_reports")
          .select("id")
          .in("status", ["APPROVED", "UNDER_REVIEW"])
          .is("renter_id", null)
          .textSearch('search_vector', tsQuery, { type: 'websearch', config: 'english' })
          .limit(100);

        if (ftsMatches) {
          for (const match of ftsMatches) {
            unlinkedReportIds.add(match.id);
          }
        }
      }

      // Strategy 2: ILIKE search on name field (catches what FTS might miss)
      const { data: reportMatches } = await supabase
        .from("incident_reports")
        .select("id")
        .or(`reported_full_name.ilike.%${nameNorm}%`)
        .in("status", ["APPROVED", "UNDER_REVIEW"])
        .is("renter_id", null)
        .limit(100);

      if (reportMatches) {
        for (const report of reportMatches) {
          unlinkedReportIds.add(report.id);
        }
      }

      // Strategy 3: Search with individual name parts (first name, last name)
      const nameParts = nameNorm.split(' ').filter(p => p.length >= 2);
      if (nameParts.length >= 2) {
        const firstName = nameParts[0];
        const lastName = nameParts[nameParts.length - 1];

        // Search for reports matching first AND last name separately
        const { data: partialMatches } = await supabase
          .from("incident_reports")
          .select("id, reported_full_name")
          .in("status", ["APPROVED", "UNDER_REVIEW"])
          .is("renter_id", null)
          .or(`reported_full_name.ilike.%${firstName}%,reported_full_name.ilike.%${lastName}%`)
          .limit(100);

        if (partialMatches) {
          // Filter to only include reports that have BOTH first and last name
          for (const report of partialMatches) {
            const reportNameNorm = normalizeName(report.reported_full_name) || '';
            if (reportNameNorm.includes(firstName) && reportNameNorm.includes(lastName)) {
              unlinkedReportIds.add(report.id);
            }
          }
        }
      }

      // Strategy 4: Search in aliases JSONB array
      const { data: aliasReports } = await supabase
        .from("incident_reports")
        .select("id, reported_aliases")
        .in("status", ["APPROVED", "UNDER_REVIEW"])
        .is("renter_id", null)
        .not("reported_aliases", "is", null)
        .limit(200);

      if (aliasReports) {
        for (const report of aliasReports) {
          const aliases = report.reported_aliases as string[] | null;
          if (aliases && aliases.length > 0) {
            const matched = aliases.some(alias => {
              const aliasNorm = normalizeName(alias);
              if (!aliasNorm) return false;
              // Check if alias matches search name (either direction)
              return aliasNorm.includes(nameNorm) ||
                nameNorm.includes(aliasNorm) ||
                // Also check individual name parts
                nameParts.every(part => aliasNorm.includes(part));
            });
            if (matched) {
              unlinkedReportIds.add(report.id);
            }
          }
        }
      }
    }

    // Pre-compute all phone variations and digits for use in multiple search sections
    const allPhoneVariations: string[] = [];
    const allSearchDigits: string[] = [];
    for (const phone of allPhonesNorm) {
      const variations = getPhoneVariations(phone);
      allPhoneVariations.push(...variations);
      allSearchDigits.push(phone.replace(/\D/g, ''));
    }
    // Deduplicate phone variations
    const phoneVariations = [...new Set(allPhoneVariations)];
    const searchDigits = allSearchDigits[0] || '';

    // Search by identifiers in incident_reports (both primary and JSONB arrays)
    // Now uses ALL provided identifiers (primary + additional)
    if (allPhonesNorm.length > 0 || allEmailsNorm.length > 0 || allFacebooksNorm.length > 0) {

      // Build OR conditions for primary identifier fields
      const orConditions: string[] = [];

      // For phone, search using multiple variations
      if (phoneVariations.length > 0) {
        // Search last 7 digits (most reliable for partial matches)
        const last7 = searchDigits.slice(-7);
        if (last7.length === 7) {
          orConditions.push(`reported_phone.ilike.%${last7}%`);
        }
        // Also try full variations
        for (const variant of phoneVariations.slice(0, 3)) {
          orConditions.push(`reported_phone.ilike.%${variant}%`);
        }
      }
      // Search ALL emails provided
      for (const email of allEmailsNorm) {
        orConditions.push(`reported_email.ilike.${email}`);
        // Also try strict email (Gmail dots removed)
        const emailStrict = normalizeEmailStrict(email);
        if (emailStrict && emailStrict !== email) {
          orConditions.push(`reported_email.ilike.${emailStrict}`);
        }
      }
      // Search ALL facebooks provided
      for (const fb of allFacebooksNorm) {
        orConditions.push(`reported_facebook.ilike.%${fb}%`);
        // Also extract just the FB ID/username
        const fbId = extractFacebookId(fb);
        if (fbId) {
          orConditions.push(`reported_facebook.ilike.%${fbId}%`);
        }
      }

      if (orConditions.length > 0) {
        const { data: identifierReportMatches } = await supabase
          .from("incident_reports")
          .select("id, reported_full_name, reported_phone, reported_email, reported_facebook, reported_phones, reported_emails, reported_facebooks, reported_aliases, reported_city, incident_region, renter_id, status")
          .in("status", ["APPROVED", "UNDER_REVIEW"])
          .is("renter_id", null)
          .or(orConditions.join(','));

        if (identifierReportMatches) {
          for (const report of identifierReportMatches) {
            unlinkedReportIds.add(report.id);
          }
        }
      }

      // Search in JSONB arrays with improved phone matching
      const { data: jsonbReports } = await supabase
        .from("incident_reports")
        .select("id, reported_phones, reported_emails, reported_facebooks")
        .in("status", ["APPROVED", "UNDER_REVIEW"])
        .is("renter_id", null)
        .limit(500);

      if (jsonbReports) {
        for (const report of jsonbReports) {
          let matched = false;

          // Check phones array with variation matching (against ALL search phones)
          if (phoneVariations.length > 0 && report.reported_phones) {
            const phones = report.reported_phones as string[];
            if (phones.length > 0) {
              matched = phones.some(p => {
                const pDigits = p.replace(/\D/g, '');
                const pVariations = getPhoneVariations(p);
                // Check if any variation matches any search phone
                return phoneVariations.some(searchVar =>
                  pVariations.some(pVar =>
                    pVar === searchVar ||
                    pVar.includes(searchVar) ||
                    searchVar.includes(pVar)
                  )
                ) ||
                  // Also check last 7 digits match against ALL search digits
                  allSearchDigits.some(sd =>
                    pDigits.length >= 7 && sd.length >= 7 &&
                    pDigits.slice(-7) === sd.slice(-7)
                  );
              });
            }
          }

          // Check emails array (against ALL search emails)
          if (!matched && allEmailsNorm.length > 0 && report.reported_emails) {
            const emails = report.reported_emails as string[];
            if (emails.length > 0) {
              matched = emails.some(e => {
                const eNorm = e.toLowerCase().trim();
                const eStrict = normalizeEmailStrict(e);
                // Check against all provided emails
                return allEmailsNorm.some(searchEmail => {
                  const searchStrict = normalizeEmailStrict(searchEmail);
                  return eNorm === searchEmail || eStrict === searchStrict;
                });
              });
            }
          }

          // Check facebooks array (against ALL search facebooks)
          if (!matched && allFacebooksNorm.length > 0 && report.reported_facebooks) {
            const facebooks = report.reported_facebooks as string[];
            if (facebooks.length > 0) {
              matched = facebooks.some(f => {
                const fNorm = normalizeFacebookUrl(f);
                const fId = extractFacebookId(f);
                // Check against all provided facebooks
                return allFacebooksNorm.some(searchFb => {
                  const searchFbId = extractFacebookId(searchFb);
                  return (fNorm && fNorm === searchFb) ||
                    (fId && searchFbId && fId === searchFbId) ||
                    (fNorm && searchFb && (fNorm.includes(searchFb) || searchFb.includes(fNorm)));
                });
              });
            }
          }

          if (matched) {
            unlinkedReportIds.add(report.id);
          }
        }
      }
    }

    // ============================================
    // SEARCH BY DATE OF BIRTH (if provided)
    // DOB alone is not strong enough, must also match name/alias
    // ============================================
    if (searchInput.dateOfBirth && nameNorm) {
      const dobNorm = normalizeDateOfBirth(searchInput.dateOfBirth);
      if (dobNorm) {
        // Split search name into parts for matching
        const searchNameParts = nameNorm.split(' ').filter(p => p.length >= 2);
        
        const { data: dobReports } = await supabase
          .from("incident_reports")
          .select("id, reported_full_name, reported_aliases, reported_date_of_birth")
          .in("status", ["APPROVED", "UNDER_REVIEW"])
          .is("renter_id", null)
          .eq("reported_date_of_birth", dobNorm)
          .limit(100);

        if (dobReports) {
          for (const report of dobReports) {
            // Check if name also matches (main name or alias)
            const reportNameNorm = normalizeName(report.reported_full_name);
            let nameMatches = false;

            if (reportNameNorm) {
              const similarity = nameSimilarity(nameNorm, reportNameNorm);
              if (similarity >= 0.85 || 
                  reportNameNorm.includes(nameNorm) || 
                  nameNorm.includes(reportNameNorm)) {
                nameMatches = true;
              }

              // Also check name parts
              if (!nameMatches && searchNameParts.length >= 2) {
                const firstName = searchNameParts[0];
                const lastName = searchNameParts[searchNameParts.length - 1];
                if (reportNameNorm.includes(firstName) && reportNameNorm.includes(lastName)) {
                  nameMatches = true;
                }
              }
            }

            // Check against aliases if main name doesn't match
            if (!nameMatches && report.reported_aliases) {
              const aliases = report.reported_aliases as string[] | null;
              if (aliases && aliases.length > 0) {
                nameMatches = aliases.some(alias => {
                  const aliasNorm = normalizeName(alias);
                  if (!aliasNorm) return false;
                  const similarity = nameSimilarity(nameNorm, aliasNorm);
                  return similarity >= 0.85 || 
                         aliasNorm.includes(nameNorm) || 
                         nameNorm.includes(aliasNorm) ||
                         searchNameParts.every((part: string) => aliasNorm.includes(part));
                });
              }
            }

            if (nameMatches) {
              unlinkedReportIds.add(report.id);
            }
          }
        }
      }
    }

    // ============================================
    // SEARCH IN APPROVED AMENDMENTS
    // Look for NEW_IDENTIFIER amendments that have been approved
    // These contain additional phones/emails/FB that should be searchable
    // Uses ALL provided identifiers for comprehensive search
    // ============================================
    if (allPhonesNorm.length > 0 || allEmailsNorm.length > 0 || allFacebooksNorm.length > 0) {
      const { data: amendments } = await supabase
        .from("report_amendments")
        .select("report_id, changes_json")
        .eq("amendment_type", "NEW_IDENTIFIER")
        .eq("status", "APPROVED");

      if (amendments) {
        // Use the pre-computed phone variations

        for (const amendment of amendments) {
          const changes = amendment.changes_json as {
            phone?: string;
            email?: string;
            facebookLink?: string;
            phones?: string[];
            emails?: string[];
            facebookLinks?: string[];
          } | null;

          if (!changes) continue;

          let matched = false;

          // Check phone in amendment against ALL search phones
          if (phoneVariations.length > 0) {
            const amendPhones = [
              changes.phone,
              ...(changes.phones || [])
            ].filter(Boolean) as string[];

            for (const p of amendPhones) {
              const pDigits = p.replace(/\D/g, '');
              const pVariations = getPhoneVariations(p);
              // Check against all search phone variations
              if (phoneVariations.some(sv => pVariations.some(pv => pv === sv)) ||
                // Also check last 7 digits against all search digits
                allSearchDigits.some(sd =>
                  pDigits.length >= 7 && sd.length >= 7 && pDigits.slice(-7) === sd.slice(-7)
                )) {
                matched = true;
                break;
              }
            }
          }

          // Check email in amendment against ALL search emails
          if (!matched && allEmailsNorm.length > 0) {
            const amendEmails = [
              changes.email,
              ...(changes.emails || [])
            ].filter(Boolean) as string[];

            matched = amendEmails.some(e =>
              allEmailsNorm.some(searchEmail => e.toLowerCase().trim() === searchEmail)
            );
          }

          // Check facebook in amendment against ALL search facebooks
          if (!matched && allFacebooksNorm.length > 0) {
            const amendFbs = [
              changes.facebookLink,
              ...(changes.facebookLinks || [])
            ].filter(Boolean) as string[];

            matched = amendFbs.some(f => {
              const fId = extractFacebookId(f);
              return allFacebooksNorm.some(searchFb => {
                const searchFbId = extractFacebookId(searchFb);
                return (searchFbId && fId && searchFbId === fId) ||
                  f.toLowerCase().includes(searchFb) ||
                  searchFb.includes(f.toLowerCase());
              });
            });
          }

          if (matched && amendment.report_id) {
            unlinkedReportIds.add(amendment.report_id);
          }
        }
      }
    }

    // Fetch full candidate data for scoring from renters table
    if (candidateIds.size > 0) {
      const { data: renters, error: rentersError } = await supabase
        .from("renters")
        .select(`
          id,
          fingerprint,
          full_name,
          full_name_normalized,
          city,
          region,
          total_incidents,
          verified_incidents,
          last_incident_date,
          verification_status,
          renter_identifiers (
            identifier_type,
            identifier_normalized,
            identifier_value
          )
        `)
        .in("id", Array.from(candidateIds));

      if (!rentersError && renters) {
        for (const renter of renters) {
          const identifiers = (renter.renter_identifiers as Array<{
            identifier_type: 'PHONE' | 'EMAIL' | 'FACEBOOK' | 'GOVT_ID';
            identifier_normalized: string;
            identifier_value: string;
          }>) || [];

          // Note: renters table doesn't have DOB directly
          // DOB is in incident_reports table, we'll fetch it later if needed
          candidates.push({
            id: renter.id,
            fullName: renter.full_name,
            fullNameNormalized: renter.full_name_normalized,
            city: renter.city,
            region: renter.region,
            identifiers: identifiers.map((id) => ({
              type: id.identifier_type,
              normalized: id.identifier_normalized,
              value: id.identifier_value,
            })),
          });
        }
      }
    }

    // ============================================
    // CREATE CANDIDATES FROM UNLINKED INCIDENT REPORTS
    // Includes all identifiers from JSONB arrays AND approved amendments
    // ============================================
    if (unlinkedReportIds.size > 0) {
      const reportIdArray = Array.from(unlinkedReportIds);

      // Fetch reports
      const { data: unlinkedReports } = await supabase
        .from("incident_reports")
        .select(`
          id,
          reported_full_name,
          reported_phone,
          reported_email,
          reported_facebook,
          reported_phones,
          reported_emails,
          reported_facebooks,
          reported_aliases,
          reported_date_of_birth,
          reported_city,
          incident_region,
          incident_date,
          incident_type,
          amount_involved,
          status
        `)
        .in("id", reportIdArray);

      // Also fetch approved amendments for these reports to get additional identifiers
      const { data: reportAmendments } = await supabase
        .from("report_amendments")
        .select("report_id, changes_json")
        .in("report_id", reportIdArray)
        .eq("amendment_type", "NEW_IDENTIFIER")
        .eq("status", "APPROVED");

      // Group amendments by report_id
      const amendmentsByReport = new Map<string, Array<{
        phone?: string;
        email?: string;
        facebookLink?: string;
        phones?: string[];
        emails?: string[];
        facebookLinks?: string[];
      }>>();

      if (reportAmendments) {
        for (const amendment of reportAmendments) {
          const changes = amendment.changes_json as {
            phone?: string;
            email?: string;
            facebookLink?: string;
            phones?: string[];
            emails?: string[];
            facebookLinks?: string[];
          } | null;
          if (changes && amendment.report_id) {
            const existing = amendmentsByReport.get(amendment.report_id) || [];
            existing.push(changes);
            amendmentsByReport.set(amendment.report_id, existing);
          }
        }
      }

      if (unlinkedReports) {
        for (const report of unlinkedReports) {
          // Build identifiers from the report (including JSONB arrays)
          const identifiers: Array<{
            type: 'PHONE' | 'EMAIL' | 'FACEBOOK' | 'GOVT_ID';
            normalized: string;
            value: string;
          }> = [];

          // Collect all phones from report
          const reportPhones = new Set<string>();
          if (report.reported_phone) reportPhones.add(report.reported_phone);
          const phonesArray = report.reported_phones as string[] | null;
          if (phonesArray && phonesArray.length > 0) {
            phonesArray.forEach(p => reportPhones.add(p));
          }

          // Add phones from amendments
          const amendments = amendmentsByReport.get(report.id) || [];
          for (const amendment of amendments) {
            if (amendment.phone) reportPhones.add(amendment.phone);
            if (amendment.phones) amendment.phones.forEach((p: string) => reportPhones.add(p));
          }

          // Normalize and add phone identifiers
          for (const phone of reportPhones) {
            const normalizedPhone = normalizePhone(phone);
            if (normalizedPhone) {
              identifiers.push({
                type: 'PHONE',
                normalized: normalizedPhone,
                value: phone,
              });
            }
          }

          // Collect all emails from report
          const reportEmails = new Set<string>();
          if (report.reported_email) reportEmails.add(report.reported_email);
          const emailsArray = report.reported_emails as string[] | null;
          if (emailsArray && emailsArray.length > 0) {
            emailsArray.forEach(e => reportEmails.add(e));
          }

          // Add emails from amendments
          for (const amendment of amendments) {
            if (amendment.email) reportEmails.add(amendment.email);
            if (amendment.emails) amendment.emails.forEach((e: string) => reportEmails.add(e));
          }

          // Normalize and add email identifiers
          for (const email of reportEmails) {
            const normalizedEmail = normalizeEmail(email);
            if (normalizedEmail) {
              identifiers.push({
                type: 'EMAIL',
                normalized: normalizedEmail,
                value: email,
              });
            }
          }

          // Collect all facebooks from report
          const reportFacebooks = new Set<string>();
          if (report.reported_facebook) reportFacebooks.add(report.reported_facebook);
          const facebooksArray = report.reported_facebooks as string[] | null;
          if (facebooksArray && facebooksArray.length > 0) {
            facebooksArray.forEach(f => reportFacebooks.add(f));
          }

          // Add facebooks from amendments
          for (const amendment of amendments) {
            if (amendment.facebookLink) reportFacebooks.add(amendment.facebookLink);
            if (amendment.facebookLinks) amendment.facebookLinks.forEach((f: string) => reportFacebooks.add(f));
          }

          // Normalize and add facebook identifiers
          for (const facebook of reportFacebooks) {
            const normalizedFb = normalizeFacebookUrl(facebook);
            if (normalizedFb) {
              identifiers.push({
                type: 'FACEBOOK',
                normalized: normalizedFb,
                value: facebook,
              });
            }
          }

          // Use report ID as candidate ID (prefixed to avoid collision)
          const candidateId = `report:${report.id}`;

          // Get aliases from report
          const reportAliases = report.reported_aliases as string[] | null;

          candidates.push({
            id: candidateId,
            fullName: report.reported_full_name,
            fullNameNormalized: normalizeName(report.reported_full_name),
            dateOfBirth: report.reported_date_of_birth || undefined,
            city: report.reported_city || report.incident_region,
            region: report.incident_region,
            aliases: reportAliases && reportAliases.length > 0 ? reportAliases : undefined,
            identifiers,
          });
        }
      }
    }

    // Score and rank candidates
    const scoredCandidates = scoreAndRankCandidates(searchInput, candidates, {
      minScore: filters.minConfidence || 15,
      maxResults: filters.maxResults || 50,
      requireStrongMatch: filters.requireStrongMatch,
    });

    // Separate renter IDs from report IDs
    const renterIds = scoredCandidates
      .filter((c) => !c.id.startsWith("report:"))
      .map((c) => c.id);
    const reportIds = scoredCandidates
      .filter((c) => c.id.startsWith("report:"))
      .map((c) => c.id.replace("report:", ""));

    const renterDetails: Record<string, {
      totalIncidents: number;
      verifiedIncidents: number;
      lastIncidentDate: string | null;
      verificationStatus: string | null;
      identifierCount: number;
      fingerprint: string;
      aliases?: string[];
      incidentSummaries?: Array<{
        id: string;
        type: string;
        typeLabel: string;
        category: string | null;
        categoryLabel: string | null;
        itemDescription: string | null;
        date: string;
        location: string | null;
        amountInvolved: number | null;
      }>;
    }> = {};

    // Fetch details for linked renters
    if (renterIds.length > 0) {
      const { data: details } = await supabase
        .from("renters")
        .select(`
          id,
          fingerprint,
          total_incidents,
          verified_incidents,
          last_incident_date,
          verification_status
        `)
        .in("id", renterIds);

      // Get identifier counts
      const { data: identCounts } = await supabase
        .from("renter_identifiers")
        .select("renter_id")
        .in("renter_id", renterIds);

      const countByRenter: Record<string, number> = {};
      if (identCounts) {
        for (const ic of identCounts) {
          if (ic.renter_id) {
            countByRenter[ic.renter_id] = (countByRenter[ic.renter_id] || 0) + 1;
          }
        }
      }

      if (details) {
        for (const d of details) {
          renterDetails[d.id] = {
            totalIncidents: d.total_incidents || 0,
            verifiedIncidents: d.verified_incidents || 0,
            lastIncidentDate: d.last_incident_date,
            verificationStatus: d.verification_status,
            identifierCount: countByRenter[d.id] || 0,
            fingerprint: d.fingerprint,
          };
        }
      }
    }

    // Fetch details for unlinked reports (including incident summary info)
    if (reportIds.length > 0) {
      const { data: reportDetails } = await supabase
        .from("incident_reports")
        .select(`
          id,
          incident_date,
          incident_type,
          rental_category,
          rental_item_description,
          incident_city,
          incident_region,
          amount_involved,
          reported_aliases,
          status,
          reported_phone,
          reported_email,
          reported_facebook
        `)
        .in("id", reportIds);

      if (reportDetails) {
        for (const r of reportDetails) {
          // Count identifiers from the report
          let identCount = 0;
          if (r.reported_phone) identCount++;
          if (r.reported_email) identCount++;
          if (r.reported_facebook) identCount++;

          // Build incident summary
          const incidentSummary = {
            id: r.id,
            type: r.incident_type,
            typeLabel: getIncidentTypeLabel(r.incident_type),
            category: r.rental_category,
            categoryLabel: r.rental_category ? getCategoryLabel(r.rental_category) : null,
            itemDescription: r.rental_item_description,
            date: r.incident_date,
            location: r.incident_city || r.incident_region || null,
            amountInvolved: r.amount_involved ? Number(r.amount_involved) : null,
          };

          renterDetails[`report:${r.id}`] = {
            totalIncidents: 1, // This IS the incident
            verifiedIncidents: r.status === "APPROVED" ? 1 : 0,
            lastIncidentDate: r.incident_date,
            verificationStatus: r.status === "APPROVED" ? "reported" : "pending",
            identifierCount: identCount,
            fingerprint: generateReportFingerprint(r.id),
            aliases: (r.reported_aliases as string[] | null) || undefined,
            incidentSummaries: [incidentSummary],
          };
        }
      }
    }

    // Build results
    const results: SearchResultMatch[] = scoredCandidates.map((candidate) => {
      const policy = enforceMatchPolicy(candidate.match, hasStrongInput);
      const details = renterDetails[candidate.id];
      const isUnlinkedReport = candidate.id.startsWith("report:");
      const actualId = isUnlinkedReport ? candidate.id.replace("report:", "") : candidate.id;

      // Combine aliases from candidate and details
      const aliases = [
        ...(candidate.aliases || []),
        ...(details?.aliases || []),
      ].filter((v, i, a) => a.indexOf(v) === i); // Deduplicate

      return {
        renter: {
          id: actualId,
          fingerprint: details?.fingerprint || generateReportFingerprint(actualId),
          fullName: candidate.fullName,
          nameMasked: policy.showDetails ? maskName(candidate.fullName) : maskName(candidate.fullName),
          aliases: aliases.length > 0 ? aliases : undefined,
          city: candidate.city ?? null,
          region: candidate.region ?? null,
          totalIncidents: details?.totalIncidents || 1,
          verifiedIncidents: details?.verifiedIncidents || 0,
          lastIncidentDate: details?.lastIncidentDate || null,
          verificationStatus: details?.verificationStatus || (isUnlinkedReport ? "reported" : null),
          identifierCount: details?.identifierCount || 0,
          incidentSummaries: policy.showDetails ? details?.incidentSummaries : undefined,
        },
        score: candidate.match.score,
        confidence: policy.displayConfidence,
        matchReason: candidate.match.matchReason,
        matchSignals: candidate.match.signals.map((s) => s.type),
        hasStrongMatch: candidate.match.hasStrongMatch,
        suggestedAction: candidate.match.suggestedAction,
        showDetails: policy.showDetails,
        requiresConfirmation: policy.requiresConfirmation,
        displayLabel: policy.displayLabel,
      };
    });

    // Generate tips based on search
    const tips: string[] = [];
    if (!hasStrongInput && results.length > 0) {
      tips.push("Add phone number or email for more accurate matching");
    }
    if (results.length === 0 && nameNorm) {
      tips.push("Try searching with the exact phone number or email");
      tips.push("Check the spelling of the name");
    }
    if (results.some((r) => r.requiresConfirmation)) {
      tips.push("Some matches need confirmation - add more identifiers");
    }

    // If not authenticated, return only count and metadata, no actual results
    if (!isAuthenticated && results.length > 0) {
      return {
        success: true,
        results: [],
        totalCount: results.length,
        query: originalQuery,
        meta: {
          searchTime: Date.now() - startTime,
          hasStrongInput,
          tips: tips.length > 0 ? tips : undefined,
          requiresAuth: true,
        },
      };
    }

    return {
      success: true,
      results,
      totalCount: results.length,
      query: originalQuery,
      meta: {
        searchTime: Date.now() - startTime,
        hasStrongInput,
        tips: tips.length > 0 ? tips : undefined,
      },
    };
  } catch (error) {
    console.error("Search error:", error);
    return {
      success: false,
      error: "An error occurred while searching. Please try again.",
      results: [],
      totalCount: 0,
      query: typeof queryOrInput === "string" ? { query: queryOrInput } : queryOrInput,
      meta: {
        searchTime: Date.now() - startTime,
        hasStrongInput: false,
      },
    };
  }
}

/**
 * Get renter profile by fingerprint
 * Supports both linked renters and unlinked reports (fingerprint starts with "report-")
 */
export async function getRenterByFingerprint(fingerprint: string): Promise<{
  success: boolean;
  error?: string;
  data?: {
    renter: {
      id: string;
      fingerprint: string;
      fullName: string;
      nameMasked: string;
      city: string | null;
      region: string | null;
      totalIncidents: number;
      verifiedIncidents: number;
      lastIncidentDate: string | null;
      verificationStatus: string | null;
    };
    incidents: Array<{
      id: string;
      incidentType: string;
      incidentDate: string;
      incidentCity: string | null;
      incidentRegion: string | null;
      amountInvolved: number | null;
      status: string;
      summaryTruncated: string | null;
      evidenceCount: number;
    }>;
    identifierCount: number;
  };
}> {
  try {
    const supabase = await createClient();

    // Check if this is an unlinked report fingerprint
    if (fingerprint.startsWith("report-")) {
      // Extract report ID prefix from fingerprint
      const reportIdPrefix = fingerprint.replace("report-", "");

      // Find the report by ID prefix
      const { data: reports } = await supabase
        .from("incident_reports")
        .select(`
          id,
          reported_full_name,
          reported_phone,
          reported_email,
          reported_facebook,
          reported_city,
          incident_type,
          incident_date,
          incident_region,
          incident_city,
          amount_involved,
          status,
          summary
        `)
        .like("id", `${reportIdPrefix}%`)
        .in("status", ["APPROVED", "UNDER_REVIEW"])
        .limit(1);

      if (!reports || reports.length === 0) {
        return {
          success: false,
          error: "Report not found",
        };
      }

      const report = reports[0];

      // Count identifiers
      let identifierCount = 0;
      if (report.reported_phone) identifierCount++;
      if (report.reported_email) identifierCount++;
      if (report.reported_facebook) identifierCount++;

      // Get evidence count
      const { count: evidenceCount } = await supabase
        .from("report_evidence")
        .select("id", { count: "exact", head: true })
        .eq("report_id", report.id);

      return {
        success: true,
        data: {
          renter: {
            id: report.id,
            fingerprint: fingerprint,
            fullName: report.reported_full_name,
            nameMasked: maskName(report.reported_full_name),
            city: report.reported_city || report.incident_city,
            region: report.incident_region,
            totalIncidents: 1,
            verifiedIncidents: report.status === "APPROVED" ? 1 : 0,
            lastIncidentDate: report.incident_date,
            verificationStatus: report.status === "APPROVED" ? "reported" : "pending_review",
          },
          incidents: [{
            id: report.id,
            incidentType: report.incident_type,
            incidentDate: report.incident_date,
            incidentCity: report.incident_city,
            incidentRegion: report.incident_region,
            amountInvolved: report.amount_involved ? parseFloat(report.amount_involved as unknown as string) : null,
            status: report.status || "PENDING",
            summaryTruncated: report.summary ? report.summary.slice(0, 200) + (report.summary.length > 200 ? "..." : "") : null,
            evidenceCount: evidenceCount || 0,
          }],
          identifierCount,
        },
      };
    }

    // Standard flow: Get renter by fingerprint from renters table
    const { data: renter, error: renterError } = await supabase
      .from("renters")
      .select(`
        id,
        fingerprint,
        full_name,
        city,
        region,
        total_incidents,
        verified_incidents,
        last_incident_date,
        verification_status
      `)
      .eq("fingerprint", fingerprint)
      .single();

    if (renterError || !renter) {
      return {
        success: false,
        error: "Renter not found",
      };
    }

    // Get public incident summaries
    const { data: incidents } = await supabase
      .from("public_incident_summaries")
      .select("*")
      .eq("renter_id", renter.id)
      .order("incident_date", { ascending: false });

    // Get identifier count
    const { count: identifierCount } = await supabase
      .from("renter_identifiers")
      .select("id", { count: "exact", head: true })
      .eq("renter_id", renter.id);

    return {
      success: true,
      data: {
        renter: {
          id: renter.id,
          fingerprint: renter.fingerprint,
          fullName: renter.full_name,
          nameMasked: maskName(renter.full_name),
          city: renter.city,
          region: renter.region,
          totalIncidents: renter.total_incidents || 0,
          verifiedIncidents: renter.verified_incidents || 0,
          lastIncidentDate: renter.last_incident_date,
          verificationStatus: renter.verification_status,
        },
        incidents: (incidents || []).map((inc) => ({
          id: inc.id!,
          incidentType: inc.incident_type!,
          incidentDate: inc.incident_date!,
          incidentCity: inc.incident_city,
          incidentRegion: inc.incident_region,
          amountInvolved: inc.amount_involved,
          status: inc.status!,
          summaryTruncated: inc.summary_truncated,
          evidenceCount: inc.evidence_count || 0,
        })),
        identifierCount: identifierCount || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching renter:", error);
    return {
      success: false,
      error: "An error occurred while fetching renter data",
    };
  }
}

/**
 * Advanced search with multiple identifiers
 * Use when user provides multiple pieces of information
 */
export async function advancedSearch(
  input: {
    name?: string;
    phone?: string;
    email?: string;
    facebook?: string;
    city?: string;
    region?: string;
  },
  filters?: SearchFilters
): Promise<SearchResponse> {
  return searchRenters(
    {
      name: input.name,
      phone: input.phone,
      email: input.email,
      facebook: input.facebook,
      city: input.city,
      region: input.region,
    },
    filters
  );
}
