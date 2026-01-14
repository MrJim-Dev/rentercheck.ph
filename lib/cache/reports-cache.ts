/**
 * Cache utilities for My Reports page
 */

const CACHE_KEY = "my-reports-cache"
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface CachedReportsData<T = any> {
    reports: T[]
    timestamp: number
}

/**
 * Load cached reports data from localStorage
 * Returns null if cache doesn't exist or is expired
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadReportsCache<T = any>(): CachedReportsData<T> | null {
    try {
        if (typeof window === 'undefined') return null
        
        const cached = localStorage.getItem(CACHE_KEY)
        if (!cached) return null
        
        const data: CachedReportsData<T> = JSON.parse(cached)
        const now = Date.now()
        
        // Check if cache is still valid
        if (now - data.timestamp < CACHE_DURATION) {
            return data
        }
        
        // Cache expired, remove it
        localStorage.removeItem(CACHE_KEY)
        return null
    } catch (error) {
        console.error("Error loading reports cache:", error)
        clearReportsCache()
        return null
    }
}

/**
 * Save reports data to cache
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function saveReportsCache<T = any>(reportsData: T[]): void {
    try {
        if (typeof window === 'undefined') return
        
        const cacheData: CachedReportsData<T> = {
            reports: reportsData,
            timestamp: Date.now()
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
    } catch (error) {
        console.error("Error saving reports cache:", error)
    }
}

/**
 * Clear the reports cache
 * Use this after creating/updating/deleting a report
 */
export function clearReportsCache(): void {
    try {
        if (typeof window === 'undefined') return
        localStorage.removeItem(CACHE_KEY)
    } catch (error) {
        console.error("Error clearing reports cache:", error)
    }
}

/**
 * Check if cache exists and is valid
 */
export function isCacheValid(): boolean {
    const cached = loadReportsCache()
    return cached !== null
}

/**
 * Get cache age in milliseconds
 */
export function getCacheAge(): number | null {
    try {
        if (typeof window === 'undefined') return null
        
        const cached = localStorage.getItem(CACHE_KEY)
        if (!cached) return null
        
        const data: CachedReportsData = JSON.parse(cached)
        return Date.now() - data.timestamp
    } catch {
        return null
    }
}
