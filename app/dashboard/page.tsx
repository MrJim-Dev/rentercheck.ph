import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle, 
  Clock, 
  Search, 
  FileText, 
  Shield,
  AlertCircle,
  Building2,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

// Mock data
const mockBusiness = {
  id: 'bus_001',
  name: 'Manila Car Rentals',
  ownerName: 'Juan Dela Cruz',
  verified: true,
  fbPage: 'facebook.com/manilacarrentals',
  branch: 'Makati Branch'
}

const mockRecentSearches = [
  { id: '1', query: 'Juan Santos', timestamp: new Date('2026-01-05T10:30:00'), matchType: 'match-found' },
  { id: '2', query: '+639171234567', timestamp: new Date('2026-01-05T09:15:00'), matchType: 'no-match' },
  { id: '3', query: 'Maria Garcia', timestamp: new Date('2026-01-04T16:45:00'), matchType: 'possible-match' },
]

const mockSubmittedReports = [
  {
    id: 'rep_001',
    renterName: 'Pedro Cruz',
    category: 'unpaid-balance',
    amount: 15000,
    status: 'active',
    submittedDate: new Date('2025-12-15'),
  },
  {
    id: 'rep_002',
    renterName: 'Ana Reyes',
    category: 'damage-dispute',
    amount: 8000,
    status: 'under-review',
    submittedDate: new Date('2026-01-02'),
  },
]

const mockDetailRequests = [
  {
    id: 'req_001',
    requestedBy: 'Cebu Motor Rentals',
    renterName: 'Pedro Cruz',
    reason: 'I have an active booking with this person',
    status: 'pending',
    requestedDate: new Date('2026-01-04'),
  },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-1">Dashboard</h1>
          <p className="text-sm text-gray-600">Manage searches, reports, and verification</p>
        </div>

        {/* Business Info Card */}
        <Card className="mb-8 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="bg-gray-100 p-3 rounded">
                  <Building2 className="h-6 w-6 text-gray-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-semibold">{mockBusiness.name}</h2>
                    {mockBusiness.verified && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1 text-green-700 border-green-300">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{mockBusiness.ownerName}</p>
                  <p className="text-xs text-gray-500">{mockBusiness.branch}</p>
                </div>
              </div>
              <Link href="/dashboard/settings">
                <Button variant="outline" size="sm" className="h-9">Edit profile</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Searches this month</p>
                  <p className="text-3xl font-semibold">47</p>
                </div>
                <Search className="h-6 w-6 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Active reports</p>
                  <p className="text-3xl font-semibold">2</p>
                </div>
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Pending requests</p>
                  <p className="text-3xl font-semibold">1</p>
                </div>
                <Clock className="h-6 w-6 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Reputation score</p>
                  <p className="text-3xl font-semibold">95</p>
                </div>
                <TrendingUp className="h-6 w-6 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="searches" className="space-y-6">
          <TabsList className="border-b border-gray-200">
            <TabsTrigger value="searches">Searches</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
          </TabsList>

          {/* Recent Searches Tab */}
          <TabsContent value="searches">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Recent Searches</CardTitle>
                <CardDescription className="text-sm">Your last 10 renter searches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockRecentSearches.map((search) => (
                    <div 
                      key={search.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <Search className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{search.query}</p>
                          <p className="text-xs text-gray-500">
                            {search.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div>
                        {search.matchType === 'match-found' && (
                          <Badge variant="destructive" className="text-xs">Match</Badge>
                        )}
                        {search.matchType === 'possible-match' && (
                          <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300">Possible</Badge>
                        )}
                        {search.matchType === 'no-match' && (
                          <Badge variant="outline" className="text-xs text-green-700 border-green-300">None</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Link href="/">
                    <Button className="bg-gray-900 hover:bg-gray-800 h-9">New search</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Your Reports Tab */}
          <TabsContent value="reports">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Your Reports</CardTitle>
                <CardDescription className="text-sm">
                  Track incidents you&apos;ve reported
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockSubmittedReports.map((report) => (
                    <div 
                      key={report.id}
                      className="p-3 border border-gray-200 rounded"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium">{report.renterName}</p>
                          <p className="text-xs text-gray-600">
                            {report.category.replace('-', ' ')} • ₱{report.amount.toLocaleString()}
                          </p>
                        </div>
                        {report.status === 'active' && <Badge variant="outline" className="text-xs text-green-700 border-green-300">Active</Badge>}
                        {report.status === 'under-review' && <Badge variant="outline" className="text-xs">Under review</Badge>}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          {report.submittedDate.toLocaleDateString()}
                        </p>
                        <Button variant="outline" size="sm" className="h-7 text-xs">View</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Link href="/report">
                    <Button className="bg-gray-900 hover:bg-gray-800 h-9">Submit report</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detail Requests Tab */}
          <TabsContent value="requests">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Incoming Requests</CardTitle>
                <CardDescription className="text-sm">
                  Other businesses requesting report details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {mockDetailRequests.length > 0 ? (
                  <div className="space-y-2">
                    {mockDetailRequests.map((request) => (
                      <div 
                        key={request.id}
                        className="p-3 bg-amber-50 border border-amber-200 rounded"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <AlertCircle className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{request.requestedBy}</p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              About: <strong>{request.renterName}</strong>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {request.reason}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">{request.status}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {request.requestedDate.toLocaleDateString()}
                          </p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="h-7 text-xs">Deny</Button>
                            <Button size="sm" className="h-7 text-xs bg-gray-900 hover:bg-gray-800">Approve</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No incoming requests</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Verification Status Card */}
        {!mockBusiness.verified && (
          <Card className="mt-8 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-amber-700 shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">Verification pending</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Your business is under review. Full access after verification.
                  </p>
                  <Button variant="outline" size="sm" className="h-8 text-xs">Check status</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  )
}
