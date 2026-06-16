import { createContext } from 'react'

export interface AuthContextType {
  isAuthenticated: boolean
  email: string | null
  uid: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)
