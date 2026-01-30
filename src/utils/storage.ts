/**
 * Storage Abstraction Layer
 *
 * Uses Capacitor Preferences for mobile (more secure than localStorage)
 * Falls back to localStorage for web development
 *
 * IMPORTANTE: Capacitor Preferences armazena dados criptografados no KeyStore (Android)
 * e Keychain (iOS), oferecendo maior segurança que localStorage puro.
 */

import { Preferences } from '@capacitor/preferences'
import { Capacitor } from '@capacitor/core'

const TOKEN_KEY = 'gas_driver_token'
const USER_KEY = 'gas_driver_user'

// Detecta se estamos em ambiente nativo (Capacitor)
const isNative = Capacitor.isNativePlatform()

/**
 * Armazena token de forma segura
 */
export async function setStoredToken(token: string): Promise<void> {
  if (isNative) {
    await Preferences.set({ key: TOKEN_KEY, value: token })
  } else {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

/**
 * Recupera token armazenado
 */
export async function getStoredToken(): Promise<string | null> {
  if (isNative) {
    const { value } = await Preferences.get({ key: TOKEN_KEY })
    return value
  }
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Armazena dados do usuário
 */
export async function setStoredUser(user: StoredUser): Promise<void> {
  const value = JSON.stringify(user)
  if (isNative) {
    await Preferences.set({ key: USER_KEY, value })
  } else {
    localStorage.setItem(USER_KEY, value)
  }
}

/**
 * Recupera dados do usuário
 */
export async function getStoredUser(): Promise<StoredUser | null> {
  let raw: string | null = null

  if (isNative) {
    const { value } = await Preferences.get({ key: USER_KEY })
    raw = value
  } else {
    raw = localStorage.getItem(USER_KEY)
  }

  if (!raw) return null

  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

/**
 * Limpa todos os dados de autenticação
 */
export async function clearStoredAuth(): Promise<void> {
  if (isNative) {
    await Promise.all([
      Preferences.remove({ key: TOKEN_KEY }),
      Preferences.remove({ key: USER_KEY }),
    ])
  } else {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }
}

/**
 * Interface para dados do usuário armazenados
 */
export interface StoredUser {
  id: number
  email: string
  role: string
  full_name?: string
}

// Cache em memória para evitar chamadas assíncronas frequentes
let tokenCache: string | null = null
let userCache: StoredUser | null = null

/**
 * Inicializa o cache de storage (chamar no boot do app)
 */
export async function initStorageCache(): Promise<{ token: string | null; user: StoredUser | null }> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Storage init timeout')), 5000)
  )
  try {
    const result = await Promise.race([
      (async () => {
        tokenCache = await getStoredToken()
        userCache = await getStoredUser()
        return { token: tokenCache, user: userCache }
      })(),
      timeout,
    ])
    return result
  } catch {
    tokenCache = null
    userCache = null
    return { token: null, user: null }
  }
}

/**
 * Retorna token do cache (síncrono, para interceptors)
 */
export function getCachedToken(): string | null {
  return tokenCache
}

/**
 * Atualiza token no cache e storage
 */
export async function setCachedToken(token: string): Promise<void> {
  tokenCache = token
  await setStoredToken(token)
}

/**
 * Atualiza usuário no cache e storage
 */
export async function setCachedUser(user: StoredUser): Promise<void> {
  userCache = user
  await setStoredUser(user)
}

/**
 * Retorna usuário do cache
 */
export function getCachedUser(): StoredUser | null {
  return userCache
}

/**
 * Limpa cache e storage
 */
export async function clearCache(): Promise<void> {
  tokenCache = null
  userCache = null
  await clearStoredAuth()
}
