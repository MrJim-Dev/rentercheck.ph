"use server";

import { createClient } from "@/lib/supabase/server";
import {
  normalizePhone,
  normalizeEmail,
  normalizeFacebookUrl,
  normalizeName,
  scoreAndRankCandidates,
  enforceMatchPolicy,
  type SearchInput,
  type CandidateData,
  type SearchQuery,
  type SearchFilters,
  type SearchResponse,
  type SearchResultMatch,
} from "@/lib/matching";

// ============================================
// SEARCH FUNCTIONS
// ============================================

/**
 * Parse a free-text query to extract identifiers
 * Tries to detect if query is a phone, email, FB URL, or name
 */
function parseSearchQuery(query: string): SearchInput {
  const trimmed = query.trim();

  // Check for email pattern
  if (trimmed.includes("@")) {
    return { email: trimmed };
  }

  // Check for Facebook URL pattern
  if (
    trimmed.includes("facebook.com") ||
    trimmed.includes("fb.com") ||
    trimmed.startsWith("fb:")
  ) {
    return { facebook: trimmed.replace(/^fb:/i, "") };
  }

  // Check for phone pattern (starts with +, 09, 63, or mostly digits)
  const digitsOnly = trimmed.replace(/[\s\-()]/g, "");
  if (
    trimmed.startsWith("+") ||
    trimmed.startsWith("09") ||
    trimmed.startsWith("63") ||
    (digitsOnly.match(/^\d+$/) && digitsOnly.length >= 7)
  ) {
    return { phone: trimmed };
  }

  // Default to name search
  return { name: trimmed };
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
 * Search for renters matching the given query
 */
export async function searchRenters(
  queryOrInput: string | SearchQuery,
  filters: SearchFilters = {}
): Promise<SearchResponse> {
  const startTime = Date.now();
  const supabase = await createClient();

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
        city: queryOrInput.city || undefined,
        region: queryOrInput.region || undefined,
      };
    }

    // Check if we have strong identifiers in the input
    const hasStrongInput = !!(
      searchInput.phone ||
      searchInput.email ||
      searchInput.facebook
    );

    // Normalize inputs for database search
    const phoneNorm = normalizePhone(searchInput.phone);
    const emailNorm = normalizeEmail(searchInput.email);
    const facebookNorm = normalizeFacebookUrl(searchInput.facebook);
    const nameNorm = normalizeName(searchInput.name);

    // If no valid input, return empty
    if (!phoneNorm && !emailNorm && !facebookNorm && !nameNorm) {
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
    // Searches both primary fields AND JSONB arrays
    // ============================================
    
    // Search by name in incident_reports (including aliases)
    if (nameNorm) {
      // First search primary name field
      const { data: reportMatches } = await supabase
        .from("incident_reports")
        .select("id, reported_full_name, reported_phone, reported_email, reported_facebook, reported_phones, reported_emails, reported_facebooks, reported_aliases, reported_city, incident_region, renter_id, status")
        .or(`reported_full_name.ilike.%${nameNorm}%`)
        .in("status", ["APPROVED", "UNDER_REVIEW"])
        .is("renter_id", null)
        .limit(100);

      if (reportMatches) {
        for (const report of reportMatches) {
          unlinkedReportIds.add(report.id);
        }
      }

      // Also search in aliases JSONB array using raw SQL via RPC or direct query
      // Note: For JSONB array contains search, we need to use a different approach
      const { data: aliasMatches } = await supabase
        .from("incident_reports")
        .select("id")
        .in("status", ["APPROVED", "UNDER_REVIEW"])
        .is("renter_id", null)
        .not("reported_aliases", "is", null)
        .limit(100);

      // Filter alias matches client-side (Supabase doesn't have great JSONB array search)
      if (aliasMatches) {
        // Fetch full data for potential matches to check aliases
        const { data: fullReports } = await supabase
          .from("incident_reports")
          .select("id, reported_aliases")
          .in("id", aliasMatches.map(m => m.id));

        if (fullReports) {
          for (const report of fullReports) {
            const aliases = report.reported_aliases as string[] | null;
            if (aliases && aliases.some(alias => 
              alias.toLowerCase().includes(nameNorm) || 
              nameNorm.includes(alias.toLowerCase())
            )) {
              unlinkedReportIds.add(report.id);
            }
          }
        }
      }
    }

    // Search by identifiers in incident_reports (both primary and JSONB arrays)
    if (phoneNorm || emailNorm || facebookNorm) {
      // Build OR conditions for primary identifier fields
      const orConditions: string[] = [];
      
      if (phoneNorm) {
        const phoneDigits = phoneNorm.replace(/\D/g, '');
        const lastDigits = phoneDigits.slice(-10);
        orConditions.push(`reported_phone.ilike.%${lastDigits}%`);
      }
      if (emailNorm) {
        orConditions.push(`reported_email.ilike.${emailNorm}`);
      }
      if (facebookNorm) {
        orConditions.push(`reported_facebook.ilike.%${facebookNorm}%`);
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

      // Also search in JSONB arrays (fetch all and filter client-side for now)
      const { data: jsonbReports } = await supabase
        .from("incident_reports")
        .select("id, reported_phones, reported_emails, reported_facebooks")
        .in("status", ["APPROVED", "UNDER_REVIEW"])
        .is("renter_id", null)
        .limit(200);

      if (jsonbReports) {
        for (const report of jsonbReports) {
          let matched = false;

          // Check phones array
          if (phoneNorm && report.reported_phones) {
            const phones = report.reported_phones as string[];
            const phoneDigits = phoneNorm.replace(/\D/g, '');
            matched = phones.some(p => {
              const pDigits = p.replace(/\D/g, '');
              return pDigits.includes(phoneDigits) || phoneDigits.includes(pDigits);
            });
          }

          // Check emails array
          if (!matched && emailNorm && report.reported_emails) {
            const emails = report.reported_emails as string[];
            matched = emails.some(e => e.toLowerCase() === emailNorm);
          }

          // Check facebooks array
          if (!matched && facebookNorm && report.reported_facebooks) {
            const facebooks = report.reported_facebooks as string[];
            matched = facebooks.some(f => 
              f.toLowerCase().includes(facebookNorm) || 
              facebookNorm.includes(f.toLowerCase())
            );
          }

          if (matched) {
            unlinkedReportIds.add(report.id);
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
    // Includes all identifiers from JSONB arrays
    // ============================================
    if (unlinkedReportIds.size > 0) {
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
          reported_city,
          incident_region,
          incident_date,
          incident_type,
          amount_involved,
          status
        `)
        .in("id", Array.from(unlinkedReportIds));

      if (unlinkedReports) {
        for (const report of unlinkedReports) {
          // Build identifiers from the report (including JSONB arrays)
          const identifiers: Array<{
            type: 'PHONE' | 'EMAIL' | 'FACEBOOK' | 'GOVT_ID';
            normalized: string;
            value: string;
          }> = [];

          // Get all phones (from JSONB array or primary field)
          const allPhones = (report.reported_phones as string[] | null) || 
            (report.reported_phone ? [report.reported_phone] : []);
          
          for (const phone of allPhones) {
            const normalizedPhone = normalizePhone(phone);
            if (normalizedPhone) {
              identifiers.push({
                type: 'PHONE',
                normalized: normalizedPhone,
                value: phone,
              });
            }
          }

          // Get all emails (from JSONB array or primary field)
          const allEmails = (report.reported_emails as string[] | null) || 
            (report.reported_email ? [report.reported_email] : []);
          
          for (const email of allEmails) {
            const normalizedEmail = normalizeEmail(email);
            if (normalizedEmail) {
              identifiers.push({
                type: 'EMAIL',
                normalized: normalizedEmail,
                value: email,
              });
            }
          }

          // Get all facebooks (from JSONB array or primary field)
          const allFacebooks = (report.reported_facebooks as string[] | null) || 
            (report.reported_facebook ? [report.reported_facebook] : []);
          
          for (const facebook of allFacebooks) {
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
          
          candidates.push({
            id: candidateId,
            fullName: report.reported_full_name,
            fullNameNormalized: normalizeName(report.reported_full_name),
            city: report.reported_city || report.incident_region,
            region: report.incident_region,
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

    // Fetch details for unlinked reports
    if (reportIds.length > 0) {
      const { data: reportDetails } = await supabase
        .from("incident_reports")
        .select(`
          id,
          incident_date,
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

          renterDetails[`report:${r.id}`] = {
            totalIncidents: 1, // This IS the incident
            verifiedIncidents: r.status === "APPROVED" ? 1 : 0,
            lastIncidentDate: r.incident_date,
            verificationStatus: r.status === "APPROVED" ? "reported" : "pending",
            identifierCount: identCount,
            fingerprint: generateReportFingerprint(r.id),
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

      return {
        renter: {
          id: actualId,
          fingerprint: details?.fingerprint || generateReportFingerprint(actualId),
          fullName: candidate.fullName,
          nameMasked: policy.showDetails ? maskName(candidate.fullName) : maskName(candidate.fullName),
          city: candidate.city ?? null,
          region: candidate.region ?? null,
          totalIncidents: details?.totalIncidents || 1,
          verifiedIncidents: details?.verifiedIncidents || 0,
          lastIncidentDate: details?.lastIncidentDate || null,
          verificationStatus: details?.verificationStatus || (isUnlinkedReport ? "reported" : null),
          identifierCount: details?.identifierCount || 0,
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
