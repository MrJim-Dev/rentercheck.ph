import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { WelcomeEmail } from '@/components/emails/welcome-email'
import { sendEmail } from '@/lib/email'
import { createMrJimRequestClient } from '@/lib/mrjim-auth/request-client'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const cookieStore = await cookies()
  const next = url.searchParams.get('next')?.startsWith('/') ? url.searchParams.get('next')! : '/'
  const client = await createMrJimRequestClient()
  const code = url.searchParams.get('code')
  if (code) {
    const result = await client.auth.exchangeCodeForSession(code)
    if (result.error === null) return NextResponse.redirect(new URL(next, url.origin))
  }
  const token = url.searchParams.get('token')
  const email = url.searchParams.get('email')
  const flow = url.searchParams.get('flow')
  if (token && email && flow === 'confirmation') {
    const result = await client.auth.verifyOtp({ email, token, type: 'signup', options: { redirectTo: `${url.origin}/auth/callback` } })
    if (result.error === null) {
      if (result.data.user) await sendEmail({ to: email, subject: 'Welcome to RenterCheck!', react: WelcomeEmail({ name: String(result.data.user.user_metadata.full_name ?? email.split('@')[0]) }) })
      return NextResponse.redirect(new URL(next, url.origin))
    }
  }
  cookieStore.delete('rentercheck-oauth-return-to')
  return NextResponse.redirect(new URL('/auth/auth-code-error', url.origin))
}
