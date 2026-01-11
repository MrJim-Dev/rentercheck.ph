'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchBarProps {
  initialQuery: string
  initialType: string
}

export function SearchBar({ initialQuery, initialType }: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      const params = new URLSearchParams({
        q: query,
        type: initialType
      })
      router.push(`/search?${params.toString()}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search renter..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-10 border-0 focus-visible:ring-0 shadow-none"
          />
        </div>
        <Button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white font-medium h-10 px-6">
          Search
        </Button>
      </div>
    </form>
  )
}
