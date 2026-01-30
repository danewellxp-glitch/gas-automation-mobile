/**
 * Auth Context
 *
 * Gerencia estado de autenticação global.
 * Usa Capacitor Preferences para armazenamento seguro em mobile.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  loginDriver,
  type LoginRequest,
  type LoginResponse,
} from '../services/api'
import {
  clearCache,
  getCachedToken,
  getCachedUser,
  initStorageCache,
  setCachedToken,
  setCachedUser,
  type StoredUser,
} from '../utils/storage'
import { initPushNotifications, cleanupPushNotifications } from '../services/pushNotifications'

// ============================================================================
// TYPES
// ============================================================================

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
  logout: () => Promise<void>
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextValue | null>(null)

// ============================================================================
// PROVIDER
// ============================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  })

  /**
   * Logout - limpa cache, storage e push notifications
   */
  const logout = useCallback(async () => {
    await cleanupPushNotifications()
    await clearCache()
    setState({ isAuthenticated: false, user: null, isLoading: false })
  }, [])

  /**
   * Login - autentica e armazena credenciais
   */
  const login = useCallback(async (credentials: LoginRequest) => {
    setState((s) => ({ ...s, isLoading: true }))

    try {
      const res: LoginResponse = await loginDriver(credentials)

      // Armazena token de forma segura
      await setCachedToken(res.access_token)

      // Prepara dados do usuário
      const userData: User = res.user
        ? {
            id: res.user.id,
            email: res.user.email,
            full_name: res.user.full_name || res.user.email,
            role: res.user.role,
          }
        : {
            id: 0,
            email: credentials.email,
            full_name: credentials.email,
            role: res.role,
          }

      // Armazena usuário
      const storedUser: StoredUser = {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        full_name: userData.full_name,
      }
      await setCachedUser(storedUser)

      setState({
        isAuthenticated: true,
        user: userData,
        isLoading: false,
      })

      // Registra push notifications após login
      initPushNotifications().catch(() => {})
    } catch (error) {
      setState((s) => ({ ...s, isLoading: false }))
      throw error
    }
  }, [])

  /**
   * Inicialização - restaura sessão do storage
   */
  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        // Inicializa cache do storage
        await initStorageCache()

        const token = getCachedToken()
        const storedUser = getCachedUser()

        if (mounted && token && storedUser) {
          setState({
            isAuthenticated: true,
            user: {
              id: storedUser.id,
              email: storedUser.email,
              full_name: storedUser.full_name || storedUser.email,
              role: storedUser.role,
            },
            isLoading: false,
          })
          initPushNotifications().catch(() => {})
        } else if (mounted) {
          setState((s) => ({ ...s, isLoading: false }))
        }
      } catch {
        if (mounted) {
          setState((s) => ({ ...s, isLoading: false }))
        }
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [])

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ============================================================================
// HOOK
// ============================================================================

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
