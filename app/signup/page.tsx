'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Shield, ChevronRight, ChevronLeft } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Account info
    email: '',
    password: '',
    confirmPassword: '',
    // Business info
    businessName: '',
    ownerName: '',
    phone: '',
    dti: '',
    sec: '',
    fbPage: '',
    branch: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement signup logic
    console.log('Signup:', formData)
    router.push('/dashboard')
  }

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 to-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-gray-600">Join verified rental businesses across the Philippines</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {step} of 2</span>
            <span className="text-sm text-gray-500">
              {step === 1 ? 'Account information' : 'Business details'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Account Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Business email address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="you@business.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      placeholder="Minimum 8 characters"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      placeholder="Re-enter password"
                      required
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                    <p className="text-blue-900">
                      Use a business email for faster verification. Personal emails may require additional documentation.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Business Details */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="businessName">Business name *</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => updateField('businessName', e.target.value)}
                      placeholder="Manila Car Rentals"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="ownerName">Owner/Manager name *</Label>
                    <Input
                      id="ownerName"
                      value={formData.ownerName}
                      onChange={(e) => updateField('ownerName', e.target.value)}
                      placeholder="Juan Dela Cruz"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Business phone number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="+63 or 09xx"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dti">DTI registration (optional)</Label>
                      <Input
                        id="dti"
                        value={formData.dti}
                        onChange={(e) => updateField('dti', e.target.value)}
                        placeholder="DTI-1234567890"
                      />
                    </div>

                    <div>
                      <Label htmlFor="sec">SEC registration (optional)</Label>
                      <Input
                        id="sec"
                        value={formData.sec}
                        onChange={(e) => updateField('sec', e.target.value)}
                        placeholder="CS202312345"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="fbPage">Facebook page (optional)</Label>
                    <Input
                      id="fbPage"
                      value={formData.fbPage}
                      onChange={(e) => updateField('fbPage', e.target.value)}
                      placeholder="facebook.com/yourbusiness"
                    />
                  </div>

                  <div>
                    <Label htmlFor="branch">Branch/Location (optional)</Label>
                    <Input
                      id="branch"
                      value={formData.branch}
                      onChange={(e) => updateField('branch', e.target.value)}
                      placeholder="Makati Branch"
                    />
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
                    <p className="text-amber-900 font-medium mb-2">Verification process</p>
                    <ol className="text-amber-800 space-y-1 list-decimal list-inside">
                      <li>Your application will be manually reviewed</li>
                      <li>We may contact you for additional verification</li>
                      <li>Approval typically takes 1-3 business days</li>
                      <li>You&apos;ll receive an email once verified</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                ) : (
                  <div></div>
                )}

                {step < 2 ? (
                  <Button
                    type="button"
                    onClick={() => setStep(step + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit">
                    Create account
                  </Button>
                )}
              </div>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 font-medium hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline">Privacy Policy</Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
