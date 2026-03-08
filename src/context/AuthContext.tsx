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
  getCachedTruckPlate,
  initStorageCache,
  setCachedToken,
  setCachedUser,
  setCachedTruckPlate,
  type StoredUser,
} from '../utils/storage'
import { clearQueue } from '../services/offlineQueue'
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
  truckPlate: string | null
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  setTruckPlate: (plate: string) => Promise<void>
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
    truckPlate: null,
  })

  /**
   * Salva placa do caminhão
   */
  const setTruckPlate = useCallback(async (plate: string) => {
    await setCachedTruckPlate(plate)
    setState((s) => ({ ...s, truckPlate: plate }))
  }, [])

  /**
   * Logout - limpa cache, storage e push notifications
   */
  const logout = useCallback(async () => {
    try {
      await cleanupPushNotifications()
    } catch {
      // Não bloquear logout se push der erro
    }
    try {
      await clearCache()
      await clearQueue()
    } catch {
      // Garantir que state é limpo mesmo se storage falhar
    }
    setState({ isAuthenticated: false, user: null, isLoading: false, truckPlate: null })
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
        truckPlate: getCachedTruckPlate(),
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
            truckPlate: getCachedTruckPlate(),
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
    setTruckPlate,
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
