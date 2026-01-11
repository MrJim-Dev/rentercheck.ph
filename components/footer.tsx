import Link from 'next/link'
import { Shield } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-16">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-gray-900" />
              <span className="font-semibold text-gray-900">RenterCheck.ph</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Renter screening for rental businesses
            </p>
          </div>

          <div className="flex gap-16">
            <div className="space-y-3">
              <Link href="/about" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors">About</Link>
              <Link href="/privacy" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors">Privacy</Link>
              <Link href="/terms" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors">Terms</Link>
            </div>
            <div className="space-y-3">
              <Link href="/contact" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors">Contact</Link>
              <Link href="/faq" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors">FAQ</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-12 pt-8">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} RenterCheck.ph. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
