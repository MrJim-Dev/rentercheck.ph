'use server'

import { clearMrJimSession, createMrJimAuthClient, getCurrentIdentity, identityFromUser } from '@/lib/auth/server'
import { ensureUserProfile } from '@/lib/db/identity'
import { sanitizeReturnTo } from '@/lib/auth/redirect'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface AuthResult {
  success: boolean
  error?: string
}

export async function signup(formData: FormData) {
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const fullName = String(formData.get('fullName') || '').trim()
  const client = await createMrJimAuthClient()
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, redirectTo: `${process.env.MRJIM_SITE_URL || ''}/auth/callback` },
  })
  if (error) return { success: false, error: error.message }
  if (data?.user) await ensureUserProfile(identityFromUser(data.user))
  redirect(sanitizeReturnTo(formData.get('returnTo') as string | null, '/dashboard'))
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const client = await createMrJimAuthClient()
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) return { success: false, error: error.message }
  if (data?.user) await ensureUserProfile(identityFromUser(data.user))
  redirect(sanitizeReturnTo(formData.get('returnTo') as string | null, '/dashboard'))
}

export async function logout() {
  await clearMrJimSession()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function getUser() {
  return getCurrentIdentity()
}
