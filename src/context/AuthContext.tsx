import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  loginDriver,
  setStoredToken,
  setStoredUser,
  type LoginRequest,
  type LoginResponse,
} from '../services/api'

interface User {
  id: number
  email: string
  full_name: string
  role: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  })

  const logout = useCallback(() => {
    clearStoredAuth()
    setState({ isAuthenticated: false, user: null, isLoading: false })
  }, [])

  const login = useCallback(async (credentials: LoginRequest) => {
    setState((s) => ({ ...s, isLoading: true }))
    try {
      const res: LoginResponse = await loginDriver(credentials)
      setStoredToken(res.access_token)
      if (res.user) {
        setStoredUser({
          id: res.user.id,
          email: res.user.email,
          role: res.user.role,
        })
        setState({
          isAuthenticated: true,
          user: {
            id: res.user.id,
            email: res.user.email,
            full_name: res.user.full_name ?? res.user.email,
            role: res.user.role,
          },
          isLoading: false,
        })
      } else {
        setState({
          isAuthenticated: true,
          user: { id: 0, email: credentials.email, full_name: '', role: res.role },
          isLoading: false,
        })
      }
    } finally {
      setState((s) => ({ ...s, isLoading: false }))
    }
  }, [])

  useEffect(() => {
    const token = getStoredToken()
    const user = getStoredUser()
    if (token && user) {
      setState({
        isAuthenticated: true,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.email,
          role: user.role,
        },
        isLoading: false,
      })
    } else {
      setState((s) => ({ ...s, isLoading: false }))
    }
  }, [])

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
