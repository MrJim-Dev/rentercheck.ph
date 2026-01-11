'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { SearchBar } from '@/components/search-bar'
import { ImproveAccuracyCard } from '@/components/improve-accuracy-card'
import { SearchResultCard } from '@/components/search-result-card'
import { NoMatchResult } from '@/components/no-match-result'
import { Badge } from '@/components/ui/badge'
import { AlertCircle } from 'lucide-react'

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const type = searchParams.get('type') || 'name'

  // Mock data - replace with actual API call
  const mockResults = {
    matchType: type === 'name' ? 'possible-match' : 'match-found',
    confidence: type === 'name' ? 'low' : 'high',
    profiles: type === 'name' ? [] : [
      {
        fingerprint: 'abc123',
        confidence: 'high' as const,
        totalReports: 3,
        uniqueBusinesses: 2,
        latestActivityDate: new Date('2025-12-15'),
        categories: ['unpaid-balance' as const, 'non-return' as const],
        incidents: []
      }
    ]
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Sticky Search Bar */}
        <div className="sticky top-16 bg-white py-5 z-40 -mx-6 px-6 mb-8 border-b">
          <SearchBar initialQuery={query} initialType={type} />
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main Results */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">Search Results</h1>
              <p className="text-sm text-gray-600">
                {query}
              </p>
              {type === 'name' && (
                <div className="mt-4 flex items-start gap-2 text-sm text-amber-800 bg-amber-50 p-3 rounded border border-amber-200">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>
                    Name-only searches have low confidence. Add phone or email to improve accuracy.
                  </p>
                </div>
              )}
            </div>

            {/* Results */}
            {mockResults.matchType === 'no-match' && <NoMatchResult query={query} />}
            
            {mockResults.matchType === 'possible-match' && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded p-5">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-700 shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-base font-semibold text-yellow-900 mb-2">Possible matches found</h2>
                      <p className="text-sm text-yellow-800 mb-3">
                        Low confidence with name-only search. Add more identifiers to view results.
                      </p>
                      <Badge variant="outline" className="text-xs">Low confidence</Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {mockResults.matchType === 'match-found' && (
              <div className="space-y-4">
                {mockResults.profiles.map((profile) => (
                  <SearchResultCard key={profile.fingerprint} profile={profile} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Improve Accuracy */}
          <div className="lg:col-span-1">
            <div className="sticky top-32">
              <ImproveAccuracyCard currentQuery={query} currentType={type} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
