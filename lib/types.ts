export type IncidentCategory = 
  | 'non-return'
  | 'unpaid-balance'
  | 'damage-dispute'
  | 'chargeback'
  | 'fraud-docs'
  | 'other'

export type ReportStatus = 
  | 'under-review'
  | 'disputed'
  | 'resolved'
  | 'active'

export type MatchConfidence = 'low' | 'medium' | 'high'

export type MatchType = 'no-match' | 'possible-match' | 'match-found'

export interface Business {
  id: string
  name: string
  ownerName: string
  dti?: string
  sec?: string
  fbPage?: string
  branch?: string
  verified: boolean
  createdAt: Date
}

export interface RenterIdentifier {
  fullName?: string
  phone?: string
  email?: string
  facebook?: string
  city?: string
  province?: string
}

export interface IncidentReport {
  id: string
  reportedBy: string // Business ID
  businessName: string
  category: IncidentCategory
  amount?: number
  incidentDate: Date
  itemOrUnit?: string
  summary: string
  evidenceUrls: string[]
  hasAgreement: boolean
  hasProof: boolean
  hasTimeline: boolean
  status: ReportStatus
  createdAt: Date
  updatedAt: Date
}

export interface RenterProfile {
  fingerprint: string
  confidence: MatchConfidence
  totalReports: number
  uniqueBusinesses: number
  latestActivityDate: Date
  categories: IncidentCategory[]
  incidents: IncidentReport[]
}

export interface SearchResult {
  matchType: MatchType
  confidence: MatchConfidence
  profiles: RenterProfile[]
  suggestedFields?: string[]
}

export interface DetailRequest {
  id: string
  requestedBy: string // Business ID
  renterFingerprint: string
  incidentId: string
  reason: string
  bookingValueRange?: string
  status: 'pending' | 'approved' | 'denied'
  createdAt: Date
}

export interface AuditLog {
  id: string
  businessId: string
  action: 'search' | 'view-details' | 'export' | 'submit-report'
  targetFingerprint?: string
  metadata: Record<string, any>
  timestamp: Date
}
