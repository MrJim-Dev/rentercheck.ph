import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RenterProfile, IncidentCategory } from '@/lib/types'
import { Calendar } from 'lucide-react'

interface SearchResultCardProps {
  profile: RenterProfile
}

const categoryLabels: Record<IncidentCategory, string> = {
  'non-return': 'Non-return',
  'unpaid-balance': 'Unpaid balance',
  'damage-dispute': 'Damage dispute',
  'chargeback': 'Chargeback',
  'fraud-docs': 'Fraudulent documents',
  'other': 'Other'
}

export function SearchResultCard({ profile }: SearchResultCardProps) {
  return (
    <Card className="border-gray-200 hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="destructive" className="text-xs font-medium">Match found</Badge>
              <Badge variant="outline" className="text-xs">High confidence</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-5">
          <div>
            <p className="text-sm text-gray-600 mb-1">Reports</p>
            <p className="text-3xl font-semibold text-gray-900">{profile.totalReports}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Businesses</p>
            <p className="text-3xl font-semibold text-gray-900">{profile.uniqueBusinesses}</p>
          </div>
        </div>

        <div className="mb-5">
          <p className="text-sm font-medium text-gray-700 mb-2">Categories</p>
          <div className="flex flex-wrap gap-2">
            {profile.categories.map((category) => (
              <Badge key={category} variant="outline" className="text-xs">
                {categoryLabels[category]}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Calendar className="h-4 w-4" />
          <span>{profile.latestActivityDate.toLocaleDateString()}</span>
        </div>

        <div className="flex gap-3">
          <Link href={`/renter/${profile.fingerprint}`} className="flex-1">
            <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium h-10">
              View details
            </Button>
          </Link>
          <Link href={`/report?fingerprint=${profile.fingerprint}`}>
            <Button variant="outline" className="h-10 px-6">
              Report
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
