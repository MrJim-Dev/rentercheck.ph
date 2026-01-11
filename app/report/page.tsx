'use client'

import { Suspense, useState } from 'react'

import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { IncidentCategory } from '@/lib/types'
import { ChevronRight, ChevronLeft, Upload, AlertCircle } from 'lucide-react'

const categoryOptions: { value: IncidentCategory; label: string }[] = [
  { value: 'non-return', label: 'Non-return of item/vehicle' },
  { value: 'unpaid-balance', label: 'Unpaid balance' },
  { value: 'damage-dispute', label: 'Damage dispute' },
  { value: 'chargeback', label: 'Chargeback/payment dispute' },
  { value: 'fraud-docs', label: 'Fraudulent documents' },
  { value: 'other', label: 'Other' },
]

function ReportContent() {
  // const searchParams = useSearchParams()
  // const fingerprint = searchParams.get('fingerprint')

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1: Identify renter
    fullName: '',
    phone: '',
    email: '',
    facebook: '',
    city: '',
    // Step 2: Incident details
    category: '' as IncidentCategory,
    amount: '',
    incidentDate: '',
    itemOrUnit: '',
    summary: '',
    // Step 3: Evidence
    hasAgreement: false,
    hasProof: false,
    hasTimeline: false,
  })

  const handleNext = () => {
    setStep(step + 1)
  }

  const handlePrevious = () => {
    setStep(step - 1)
  }

  const handleSubmit = () => {
    // TODO: Implement submission logic
    console.log('Submitting report:', formData)
  }

  const updateField = (field: string, value: string | number | Date | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Submit incident report</h1>
          <p className="text-gray-600">
            Help other businesses make informed decisions by reporting factual incidents
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {step} of 4</span>
            <span className="text-sm text-gray-500">
              {step === 1 && 'Identify renter'}
              {step === 2 && 'Incident details'}
              {step === 3 && 'Evidence upload'}
              {step === 4 && 'Review & submit'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Important Notice */}
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-900 mb-1">Important guidelines</p>
                <ul className="text-amber-800 space-y-1 list-disc list-inside">
                  <li>Use factual descriptions only. Avoid labels like &ldquo;scammer&rdquo;</li>
                  <li>Reports are subject to review before becoming active</li>
                  <li>False reports may result in penalties</li>
                  <li>Reported individuals have the right to dispute</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Identify Renter */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Identify the renter</CardTitle>
              <CardDescription>
                Provide as much information as possible for accurate matching
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="Juan Dela Cruz"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+63 or 09xx"
                />
              </div>

              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <Label htmlFor="facebook">Facebook profile URL</Label>
                <Input
                  id="facebook"
                  value={formData.facebook}
                  onChange={(e) => updateField('facebook', e.target.value)}
                  placeholder="facebook.com/username"
                />
              </div>

              <div>
                <Label htmlFor="city">City/Province</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="Manila, Cebu, etc."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="text-blue-900">
                  <strong>Privacy note:</strong> Identifiers will be hashed for matching. 
                  Only verified businesses can request full details.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Incident Details */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Incident details</CardTitle>
              <CardDescription>
                Provide factual information about what happened
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category">Incident category *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="w-full mt-2 px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Select a category</option>
                  {categoryOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="amount">Amount involved (optional)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => updateField('amount', e.target.value)}
                  placeholder="15000"
                />
              </div>

              <div>
                <Label htmlFor="incidentDate">Incident date *</Label>
                <Input
                  id="incidentDate"
                  type="date"
                  value={formData.incidentDate}
                  onChange={(e) => updateField('incidentDate', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="itemOrUnit">Item/Unit involved</Label>
                <Input
                  id="itemOrUnit"
                  value={formData.itemOrUnit}
                  onChange={(e) => updateField('itemOrUnit', e.target.value)}
                  placeholder="e.g., Toyota Vios 2023, Camera Equipment"
                />
              </div>

              <div>
                <Label htmlFor="summary">Factual summary *</Label>
                <textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => updateField('summary', e.target.value)}
                  className="w-full mt-2 px-3 py-2 border rounded-md min-h-30"
                  placeholder="Describe what happened in factual terms. Include dates, amounts, and specific actions taken."
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Be specific and factual. Avoid emotional language or accusations.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Evidence Upload */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Evidence upload</CardTitle>
              <CardDescription>
                Upload supporting documents (optional but recommended)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-xs text-gray-500">
                  Supported: Images (JPG, PNG), PDF. Max 10MB per file.
                </p>
                <Button variant="outline" className="mt-4">
                  Choose files
                </Button>
              </div>

              <Separator />

              <div>
                <Label className="mb-3 block">Report quality indicators</Label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasAgreement}
                      onChange={(e) => updateField('hasAgreement', e.target.checked)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-sm">I have a signed agreement/contract</p>
                      <p className="text-xs text-gray-500">
                        Rental agreement, booking confirmation, or contract
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasProof}
                      onChange={(e) => updateField('hasProof', e.target.checked)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-sm">I have proof of incident</p>
                      <p className="text-xs text-gray-500">
                        Photos, messages, receipts, or other evidence
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasTimeline}
                      onChange={(e) => updateField('hasTimeline', e.target.checked)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-sm">I have a documented timeline</p>
                      <p className="text-xs text-gray-500">
                        Communication logs, follow-up records, or timeline of events
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Review and submit</CardTitle>
              <CardDescription>
                Please review your report before submission
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Renter information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <p><span className="text-gray-500">Name:</span> <strong>{formData.fullName}</strong></p>
                  {formData.phone && <p><span className="text-gray-500">Phone:</span> {formData.phone}</p>}
                  {formData.email && <p><span className="text-gray-500">Email:</span> {formData.email}</p>}
                  {formData.facebook && <p><span className="text-gray-500">Facebook:</span> {formData.facebook}</p>}
                  {formData.city && <p><span className="text-gray-500">Location:</span> {formData.city}</p>}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Incident information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <p>
                    <span className="text-gray-500">Category:</span>{' '}
                    <Badge variant="outline">
                      {categoryOptions.find(c => c.value === formData.category)?.label}
                    </Badge>
                  </p>
                  {formData.amount && <p><span className="text-gray-500">Amount:</span> ₱{formData.amount}</p>}
                  <p><span className="text-gray-500">Date:</span> {formData.incidentDate}</p>
                  {formData.itemOrUnit && <p><span className="text-gray-500">Item/Unit:</span> {formData.itemOrUnit}</p>}
                  <div>
                    <p className="text-gray-500 mb-1">Summary:</p>
                    <p className="text-gray-700">{formData.summary}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Report quality</h3>
                <div className="flex gap-2">
                  {formData.hasAgreement && <Badge variant="outline">Has agreement</Badge>}
                  {formData.hasProof && <Badge variant="outline">Has proof</Badge>}
                  {formData.hasTimeline && <Badge variant="outline">Has timeline</Badge>}
                  {!formData.hasAgreement && !formData.hasProof && !formData.hasTimeline && (
                    <Badge variant="outline">No evidence uploaded</Badge>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="text-blue-900 mb-2">
                  <strong>Next steps:</strong>
                </p>
                <ol className="text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Your report will be reviewed by our team</li>
                  <li>You&apos;ll be notified of the review status</li>
                  <li>Once approved, it will become visible to verified businesses</li>
                  <li>The reported individual may dispute this report</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {step < 4 ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit}>
              Submit report
            </Button>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    }>
      <ReportContent />
    </Suspense>
  )
}
