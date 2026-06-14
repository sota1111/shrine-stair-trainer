import { useState, useEffect, type ReactNode } from 'react'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { AuthContext } from './authContextValue'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true)
        setEmail(user.email)
      } else {
        setIsAuthenticated(false)
        setEmail(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const login = async (emailAddr: string, password: string) => {
    await signInWithEmailAndPassword(auth, emailAddr, password)
  }

  const logout = async () => {
    await signOut(auth)
  }

  if (loading) {
    return null
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, email, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
