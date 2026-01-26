import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { WelcomeEmail } from '@/components/emails/welcome-email'
import { sendEmail } from '@/lib/email'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error && data.user) {
            // Check if this is a new user by checking the created_at timestamp
            // If user was created in the last 10 seconds, they're a new OAuth user
            const userCreatedAt = new Date(data.user.created_at)
            const now = new Date()
            const isNewUser = (now.getTime() - userCreatedAt.getTime()) < 10000 // 10 seconds

            if (isNewUser) {
                // Send welcome email to new OAuth users
                const userName = data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'there'
                try {
                    await sendEmail({
                        to: data.user.email!,
                        subject: "Welcome to RenterCheck!",
                        react: WelcomeEmail({ name: userName }),
                    })
                } catch (emailError) {
                    console.error('Failed to send welcome email:', emailError)
                    // Don't fail the OAuth flow if email fails
                }
            }

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
