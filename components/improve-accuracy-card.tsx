'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface ImproveAccuracyCardProps {
  currentQuery: string
  currentType: string
}

export function ImproveAccuracyCard({ currentQuery, currentType }: ImproveAccuracyCardProps) {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const handleRecheck = () => {
    const params = new URLSearchParams({
      q: currentQuery,
      type: currentType
    })
    
    if (phone) params.append('phone', phone)
    if (email) params.append('email', email)
    
    router.push(`/search?${params.toString()}`)
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Improve accuracy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+63 or 09xx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-10 mt-2"
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 mt-2"
          />
        </div>

        <Button 
          onClick={handleRecheck} 
          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium h-10 mt-2"
          disabled={!phone && !email}
        >
          Re-check
        </Button>
      </CardContent>
    </Card>
  )
}
