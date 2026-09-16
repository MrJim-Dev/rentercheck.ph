import { WelcomeEmail } from '@/components/emails/welcome-email'
import { createMrJimAuthClient, identityFromUser } from '@/lib/auth/server'
import { ensureUserProfile } from '@/lib/db/identity'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export const runtime = 'nodejs'

function invalidCallback(origin: string): NextResponse {
    return NextResponse.redirect(new URL('/auth/auth-code-error', origin))
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next')?.startsWith('/') ? searchParams.get('next')! : '/'
    if (!code) return invalidCallback(origin)

    const { data, error } = await (await createMrJimAuthClient()).auth.exchangeCodeForSession(code)
    if (error || !data?.user) return invalidCallback(origin)
    await ensureUserProfile(identityFromUser(data.user))

    if (data.user.email) {
        const userName = data.user.user_metadata?.full_name || data.user.email.split('@')[0] || 'there'
        try {
            await sendEmail({ to: data.user.email, subject: 'Welcome to RenterCheck!', react: WelcomeEmail({ name: String(userName) }) })
        } catch {
            // Welcome email failure must not invalidate a completed auth exchange.
        }
    }
    return NextResponse.redirect(new URL(next, origin))
}
