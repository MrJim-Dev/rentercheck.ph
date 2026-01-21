'use server'

import { WelcomeEmail } from '@/components/emails/welcome-email'
import { sendEmail } from '@/lib/email'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface AuthResult {
  success: boolean
  error?: string
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    fullName: formData.get('fullName') as string,
    returnTo: formData.get('returnTo') as string | null,
  }

  console.log('Signup - returnTo from formData:', data.returnTo)

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
      },
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // Send welcome email
  await sendEmail({
    to: data.email,
    subject: "Welcome to RenterCheck!",
    react: WelcomeEmail({ name: data.fullName }),
  })

  revalidatePath('/', 'layout')
  
  // Validate and use returnTo only if it's a valid internal path
  const redirectPath = data.returnTo && data.returnTo.startsWith('/') ? data.returnTo : '/'
  console.log('Signup - redirecting to:', redirectPath)
  redirect(redirectPath)
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    returnTo: formData.get('returnTo') as string | null,
  }

  console.log('Login - returnTo from formData:', data.returnTo)

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  
  // Validate and use returnTo only if it's a valid internal path
  const redirectPath = data.returnTo && data.returnTo.startsWith('/') ? data.returnTo : '/'
  console.log('Login - redirecting to:', redirectPath)
  redirect(redirectPath)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
