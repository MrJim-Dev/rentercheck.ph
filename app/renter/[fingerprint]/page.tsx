import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion'
import { RequestDetailsDialog } from '@/components/request-details-dialog'
import { IncidentCategory } from '@/lib/types'
import { AlertCircle, Calendar, FileText, Building2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Mock data - replace with actual API call
const categoryLabels: Record<IncidentCategory, string> = {
  'non-return': 'Non-return',
  'unpaid-balance': 'Unpaid balance',
  'damage-dispute': 'Damage dispute',
  'chargeback': 'Chargeback',
  'fraud-docs': 'Fraudulent documents',
  'other': 'Other'
}

export default function RenterProfilePage({ params }: { params: { fingerprint: string } }) {
  // Mock data
  const profile = {
    fingerprint: params.fingerprint,
    confidence: 'high' as const,
    totalReports: 3,
    uniqueBusinesses: 2,
    latestActivityDate: new Date('2025-12-15'),
    categories: ['unpaid-balance' as const, 'non-return' as const],
    incidents: [
      {
        id: '1',
        reportedBy: 'bus_001',
        businessName: 'Manila Car Rentals',
        category: 'unpaid-balance' as const,
        amount: 15000,
        incidentDate: new Date('2025-12-10'),
        itemOrUnit: 'Toyota Vios 2023',
        summary: 'Renter failed to pay final balance after rental period ended. Multiple follow-ups sent.',
        evidenceUrls: ['evidence1.jpg', 'evidence2.pdf'],
        hasAgreement: true,
        hasProof: true,
        hasTimeline: true,
        status: 'active' as const,
        createdAt: new Date('2025-12-12'),
        updatedAt: new Date('2025-12-12')
      },
      {
        id: '2',
        reportedBy: 'bus_002',
        businessName: 'QC Motor Rentals',
        category: 'non-return' as const,
        amount: 8000,
        incidentDate: new Date('2025-11-20'),
        itemOrUnit: 'Honda Beat 2022',
        summary: 'Motorcycle not returned on agreed date. Last contact was 5 days overdue.',
        evidenceUrls: [],
        hasAgreement: true,
        hasProof: false,
        hasTimeline: true,
        status: 'resolved' as const,
        createdAt: new Date('2025-11-25'),
        updatedAt: new Date('2025-12-01')
      },
      {
        id: '3',
        reportedBy: 'bus_001',
        businessName: 'Manila Car Rentals',
        category: 'damage-dispute' as const,
        amount: 12000,
        incidentDate: new Date('2025-10-15'),
        itemOrUnit: 'Toyota Innova 2022',
        summary: 'Minor damage to rear bumper. Renter disputes responsibility.',
        evidenceUrls: ['damage1.jpg', 'damage2.jpg'],
        hasAgreement: true,
        hasProof: true,
        hasTimeline: true,
        status: 'disputed' as const,
        createdAt: new Date('2025-10-18'),
        updatedAt: new Date('2025-10-20')
      }
    ]
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="destructive" className="text-xs">Active</Badge>
      case 'disputed':
        return <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300">Disputed</Badge>
      case 'resolved':
        return <Badge variant="outline" className="text-xs text-green-700 border-green-300">Resolved</Badge>
      case 'under-review':
        return <Badge variant="outline" className="text-xs">Under review</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Summary Header */}
        <Card className="mb-8 border-gray-200">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-semibold">Renter Profile</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{profile.fingerprint}</p>
              </div>
              <Badge variant="outline" className="text-xs">High confidence</Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Reports</p>
                <p className="text-3xl font-semibold">{profile.totalReports}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Businesses</p>
                <p className="text-3xl font-semibold">{profile.uniqueBusinesses}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600 mb-1">Latest activity</p>
                <p className="text-lg font-medium">{profile.latestActivityDate.toLocaleDateString()}</p>
              </div>
            </div>

            <Separator className="my-4" />

            <div>
              <p className="text-sm text-gray-600 mb-2">Categories</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.categories.map((category) => (
                  <Badge key={category} variant="outline" className="text-xs">
                    {categoryLabels[category]}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Incident Timeline */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle>Incident Timeline</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {profile.totalReports} reported incident{profile.totalReports !== 1 ? 's' : ''}
            </p>
          </CardHeader>
          
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {profile.incidents.map((incident, index) => (
                <AccordionItem key={incident.id} value={`incident-${index}`}>
                  <AccordionTrigger>
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3 text-left">
                        <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                        <div>
                          <p className="font-medium">{categoryLabels[incident.category]}</p>
                          <p className="text-sm text-gray-500">
                            {incident.incidentDate.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {statusBadge(incident.status)}
                      </div>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent>
                    <div className="pl-7 pt-2 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500">Reported by</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Building2 className="h-4 w-4 text-gray-600" />
                            <p className="font-medium text-sm">{incident.businessName}</p>
                          </div>
                        </div>
                        
                        {incident.amount && (
                          <div>
                            <p className="text-xs font-medium text-gray-500">Amount</p>
                            <p className="font-medium text-sm mt-1">₱{incident.amount.toLocaleString()}</p>
                          </div>
                        )}
                        
                        {incident.itemOrUnit && (
                          <div>
                            <p className="text-xs font-medium text-gray-500">Item/Unit</p>
                            <p className="text-sm mt-1">{incident.itemOrUnit}</p>
                          </div>
                        )}
                        
                        <div>
                          <p className="text-xs font-medium text-gray-500">Report quality</p>
                          <div className="flex gap-1.5 mt-1">
                            {incident.hasAgreement && <Badge variant="outline" className="text-xs">Agreement</Badge>}
                            {incident.hasProof && <Badge variant="outline" className="text-xs">Proof</Badge>}
                            {incident.hasTimeline && <Badge variant="outline" className="text-xs">Timeline</Badge>}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Summary</p>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-200">
                          {incident.summary}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Reported {incident.createdAt.toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <RequestDetailsDialog />
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          <FileText className="h-3.5 w-3.5 mr-1.5" />
                          Contact reporter
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Submit New Incident CTA */}
        <Card className="mt-8 bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Have an incident to report?</h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  Submit a new incident for this renter
                </p>
              </div>
              <Link href={`/report?fingerprint=${profile.fingerprint}`}>
                <Button className="bg-gray-900 hover:bg-gray-800 h-9">Submit incident</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
