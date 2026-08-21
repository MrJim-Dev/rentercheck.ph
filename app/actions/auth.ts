'use server'

import { WelcomeEmail } from '@/components/emails/welcome-email'
import { sendEmail } from '@/lib/email'
import { createMrJimRequestClient } from '@/lib/mrjim-auth/request-client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface AuthResult { success: boolean; error?: string }

export async function signup(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const fullName = String(formData.get('fullName') ?? '').trim()
  const returnTo = String(formData.get('returnTo') ?? '')
  const client = await createMrJimRequestClient()
  const { error } = await client.auth.signUp({ email, password, options: { data: { full_name: fullName }, redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/auth/callback` } })
  if (error) return { success: false, error: error.message }
  await sendEmail({ to: email, subject: 'Welcome to RenterCheck!', react: WelcomeEmail({ name: fullName }) })
  revalidatePath('/', 'layout')
  redirect(returnTo.startsWith('/') ? returnTo : '/')
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const returnTo = String(formData.get('returnTo') ?? '')
  const client = await createMrJimRequestClient()
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) return { success: false, error: error.message }
  revalidatePath('/', 'layout')
  redirect(returnTo.startsWith('/') ? returnTo : '/')
}

export async function logout() {
  const client = await createMrJimRequestClient()
  await client.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function getUser() {
  const client = await createMrJimRequestClient()
  const result = await client.auth.getUser()
  return result.error === null ? result.data.user : null
}
