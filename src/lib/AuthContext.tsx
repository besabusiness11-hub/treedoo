import React, { createContext, useContext, useState, useEffect } from 'react'
import { api, User } from './api'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; name: string; role: 'condomino' | 'amministratore'; condominio_id?: string }) => Promise<void>
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('treedoo_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    api.auth.me()
      .then(setUser)
      .catch(() => { localStorage.removeItem('treedoo_token'); setToken(null) })
      .finally(() => setLoading(false))
  }, [token])

  const login = async (email: string, password: string) => {
    const { token: t, user: u } = await api.auth.login(email, password)
    localStorage.setItem('treedoo_token', t)
    setToken(t)
    setUser(u)
  }

  const register = async (data: Parameters<typeof api.auth.register>[0]) => {
    const { token: t, user: u } = await api.auth.register(data)
    localStorage.setItem('treedoo_token', t)
    setToken(t)
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem('treedoo_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin: user?.role === 'amministratore' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
