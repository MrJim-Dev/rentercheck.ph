'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from 'mrjim-auth'
import { getRentercheckBrowserAuthClient } from '@/lib/mrjim-auth/browser-client'
import { usePathname, useRouter } from 'next/navigation'

interface AuthContextType { user: User | null; loading: boolean }
const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  useEffect(() => {
    const auth = getRentercheckBrowserAuthClient()
    const initialize = async () => {
      const result = await auth.auth.getSession()
      setUser(result.data?.session?.user ?? null)
      setLoading(false)
    }
    void initialize()
    const subscription = auth.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') router.refresh()
    })
    const onVisibility = () => { if (document.visibilityState === 'visible') void auth.auth.getSession().then((result) => setUser(result.data?.session?.user ?? null)) }
    window.addEventListener('visibilitychange', onVisibility)
    return () => { subscription.unsubscribe(); window.removeEventListener('visibilitychange', onVisibility) }
  }, [router])
  useEffect(() => { void getRentercheckBrowserAuthClient().auth.getSession().then((result) => setUser(result.data?.session?.user ?? null)) }, [pathname])
  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) }
export async function signOutClient() { await getRentercheckBrowserAuthClient().auth.signOut() }
