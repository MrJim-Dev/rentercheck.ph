import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface NoMatchResultProps {
  query: string
}

export function NoMatchResult({ query }: NoMatchResultProps) {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-700 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-base font-semibold text-green-900 mb-2">No match found</h2>
            <p className="text-sm text-green-800 mb-4">
              No reported incidents for <span className="font-medium">{query}</span>
            </p>
            
            <div className="bg-white rounded-lg p-4 mb-4 border border-green-200">
              <p className="text-sm text-gray-700 mb-2">Keep in mind:</p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>No match doesn&apos;t guarantee zero risk</li>
                <li>Always verify through standard screening</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Link href="/">
                <Button variant="outline" size="sm" className="h-9">New search</Button>
              </Link>
              <Link href="/report">
                <Button variant="secondary" size="sm" className="h-9">Report incident</Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
