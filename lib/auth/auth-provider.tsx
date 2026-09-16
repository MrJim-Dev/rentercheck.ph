'use client'

import type { ClientAuthUser } from '@/lib/auth/types'
import { usePathname } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

interface AuthContextType {
  user: ClientAuthUser | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ClientAuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', {
        cache: 'no-store',
        credentials: 'include',
      })
      const payload = await response.json() as { user?: ClientAuthUser | null }
      setUser(payload.user ?? null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshSession()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refreshSession()
    }
    const handleAuthChange = () => void refreshSession()

    window.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('rentercheck-auth-change', handleAuthChange)

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('rentercheck-auth-change', handleAuthChange)
    }
  }, [refreshSession])

  // Refresh auth state after navigation, including the OAuth callback.
  useEffect(() => {
    void refreshSession()
  }, [pathname, refreshSession])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export async function signOutClient() {
  await fetch('/api/auth/signout', {
    method: 'POST',
    credentials: 'include',
  })
  window.dispatchEvent(new Event('rentercheck-auth-change'))
}
