import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { HeroSearch } from '@/components/hero-search'
import { CheckCircle, Shield, Clock, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <HeroSearch />

        {/* How It Works Section */}
        <section className="py-28 px-6 bg-gray-50">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-semibold text-center mb-20 text-gray-900">How it works</h2>
            <div className="grid md:grid-cols-3 gap-16">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-900 text-white font-semibold text-xl mb-6">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Search</h3>
                <p className="text-gray-600 leading-relaxed">
                  Enter name, phone, email, or Facebook profile to check against reported incidents.
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-900 text-white font-semibold text-xl mb-6">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Review</h3>
                <p className="text-gray-600 leading-relaxed">
                  Get confidence-rated results with detailed incident summaries and report counts.
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-900 text-white font-semibold text-xl mb-6">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Decide</h3>
                <p className="text-gray-600 leading-relaxed">
                  Request full details or submit new reports. All actions are logged and audited.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-28 px-6">
          <div className="container mx-auto max-w-5xl">
            <div className="grid md:grid-cols-2 gap-12 gap-y-16">
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 mb-5">
                  <Shield className="h-6 w-6 text-gray-700" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Confidence-based matching</h3>
                <p className="text-gray-600 leading-relaxed">
                  Name-only searches return lower confidence. Add phone/email for stronger matches.
                </p>
              </div>

              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 mb-5">
                  <CheckCircle className="h-6 w-6 text-gray-700" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Verified businesses only</h3>
                <p className="text-gray-600 leading-relaxed">
                  Manual approval process ensures legitimate use and reduces abuse.
                </p>
              </div>

              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 mb-5">
                  <Clock className="h-6 w-6 text-gray-700" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Full audit trail</h3>
                <p className="text-gray-600 leading-relaxed">
                  Every search and report is logged. Penalties for false reports and dispute resolution.
                </p>
              </div>

              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 mb-5">
                  <Shield className="h-6 w-6 text-gray-700" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Privacy-first design</h3>
                <p className="text-gray-600 leading-relaxed">
                  Sensitive details behind access gates. No public shaming. Factual reporting only.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-28 px-6 bg-gray-900 text-white">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-semibold mb-5">Start verifying renters today</h2>
            <p className="text-lg text-gray-300 mb-10">
              Join verified rental businesses across the Philippines
            </p>
            <Link href="/signup">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 font-medium h-12 px-10">
                Get verified
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
