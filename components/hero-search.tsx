'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function HeroSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<'name' | 'phone' | 'email' | 'facebook'>('name')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      const params = new URLSearchParams({
        q: query,
        type: searchType
      })
      router.push(`/search?${params.toString()}`)
    }
  }

  // Auto-detect search type
  const detectSearchType = (value: string) => {
    if (value.includes('@')) {
      setSearchType('email')
    } else if (value.includes('facebook.com') || value.includes('fb.com')) {
      setSearchType('facebook')
    } else if (/^[\d\s+()-]+$/.test(value)) {
      setSearchType('phone')
    } else {
      setSearchType('name')
    }
  }

  return (
    <section className="pt-32 pb-28 px-6">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-14">
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-5 text-gray-900">
            Check renter signals
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Confidence-based renter screening for rental businesses
          </p>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Name, phone, email, or Facebook link"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  detectSearchType(e.target.value)
                }}
                className="pl-11 h-12 border-gray-300 text-base focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              />
            </div>
            <Button type="submit" className="h-12 px-8 bg-gray-900 hover:bg-gray-800 text-white font-medium">
              Search
            </Button>
          </div>
          
          <p className="text-sm text-gray-500 text-center">
            Name-only searches may return low confidence results
          </p>
        </form>
      </div>
    </section>
  )
}
