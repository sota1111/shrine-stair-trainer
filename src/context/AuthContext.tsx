import { useState, useEffect, type ReactNode } from 'react'
import { AuthContext } from './authContextValue'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [uid, setUid] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const restore = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        if (!cancelled && res.ok) {
          const data = await res.json()
          setIsAuthenticated(true)
          setEmail(data.email ?? null)
          setUid(data.uid ?? null)
        }
      } catch {
        // network error — treat as unauthenticated
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    restore()
    return () => {
      cancelled = true
    }
  }, [])

  const login = async (emailAddr: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailAddr, password }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.error || 'ログインに失敗しました')
    }
    setIsAuthenticated(true)
    setEmail(data.email ?? emailAddr)
    setUid(data.uid ?? null)
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } finally {
      setIsAuthenticated(false)
      setEmail(null)
      setUid(null)
    }
  }

  if (loading) {
    return null
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, email, uid, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
