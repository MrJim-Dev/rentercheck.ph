import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize phone number for matching
 * Strips spaces, leading zeros, and standardizes +63
 */
export function normalizePhone(phone: string): string {
  let normalized = phone.trim().replace(/\s+/g, '')
  
  // Remove leading zeros
  normalized = normalized.replace(/^0+/, '')
  
  // Standardize +63 prefix
  if (normalized.startsWith('+63')) {
    normalized = '63' + normalized.slice(3)
  } else if (normalized.startsWith('63')) {
    // Already standardized
  } else {
    // Assume Philippine number, add 63
    normalized = '63' + normalized
  }
  
  return normalized
}

/**
 * Normalize email for matching
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Normalize Facebook URL to profile ID or username
 */
export function normalizeFacebookUrl(url: string): string {
  const trimmed = url.trim()
  
  // Extract profile ID or username from various FB URL formats
  const patterns = [
    /facebook\.com\/profile\.php\?id=(\d+)/,
    /facebook\.com\/([^/?]+)/,
    /fb\.com\/([^/?]+)/,
  ]
  
  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match) {
      return match[1]
    }
  }
  
  return trimmed
}

/**
 * Hash sensitive identifier for storage
 */
export async function hashIdentifier(identifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(identifier)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Calculate match confidence based on available identifiers
 */
export function calculateConfidence(identifiers: {
  name?: string
  phone?: string
  email?: string
  facebook?: string
}): 'low' | 'medium' | 'high' {
  const { name, phone, email, facebook } = identifiers
  
  // Name only = low confidence
  if (name && !phone && !email && !facebook) {
    return 'low'
  }
  
  // Name + one strong identifier = medium
  if (name && (phone || email || facebook)) {
    return 'medium'
  }
  
  // Multiple strong identifiers = high
  const strongCount = [phone, email, facebook].filter(Boolean).length
  if (strongCount >= 2) {
    return 'high'
  }
  
  return 'medium'
}
