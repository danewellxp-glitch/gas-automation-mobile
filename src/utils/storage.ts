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
const TRUCK_KEY = 'gas_driver_truck_plate'
const DELIVERIES_CACHE_KEY = 'gas_driver_deliveries_cache'

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
let truckPlateCache: string | null = null

/**
 * Inicializa o cache de storage (chamar no boot do app)
 */
export async function initStorageCache(): Promise<{ token: string | null; user: StoredUser | null; truckPlate: string | null }> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Storage init timeout')), 5000)
  )
  try {
    const result = await Promise.race([
      (async () => {
        tokenCache = await getStoredToken()
        userCache = await getStoredUser()
        truckPlateCache = await getStoredTruckPlate()
        return { token: tokenCache, user: userCache, truckPlate: truckPlateCache }
      })(),
      timeout,
    ])
    return result
  } catch {
    tokenCache = null
    userCache = null
    truckPlateCache = null
    return { token: null, user: null, truckPlate: null }
  }
}

/**
 * Armazena placa do caminhão
 */
async function setStoredTruckPlate(plate: string): Promise<void> {
  if (isNative) {
    await Preferences.set({ key: TRUCK_KEY, value: plate })
  } else {
    localStorage.setItem(TRUCK_KEY, plate)
  }
}

/**
 * Recupera placa do caminhão
 */
async function getStoredTruckPlate(): Promise<string | null> {
  if (isNative) {
    const { value } = await Preferences.get({ key: TRUCK_KEY })
    return value
  }
  return localStorage.getItem(TRUCK_KEY)
}

/**
 * Salva placa no cache e storage
 */
export async function setCachedTruckPlate(plate: string): Promise<void> {
  truckPlateCache = plate
  await setStoredTruckPlate(plate)
}

/**
 * Retorna placa do cache
 */
export function getCachedTruckPlate(): string | null {
  return truckPlateCache
}

/**
 * Limpa placa do cache e storage
 */
export async function clearTruckPlate(): Promise<void> {
  truckPlateCache = null
  if (isNative) {
    await Preferences.remove({ key: TRUCK_KEY })
  } else {
    localStorage.removeItem(TRUCK_KEY)
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
  truckPlateCache = null
  await clearStoredAuth()
  await clearTruckPlate()
  await clearDeliveriesCache()
}

// ============================================================================
// CACHE DE ENTREGAS (para offline)
// ============================================================================

export interface DeliveriesCacheEntry {
  status: 'pending' | 'active' | 'completed'
  data: unknown[]
  cachedAt: string
}

/**
 * Salva entregas no cache
 */
export async function setDeliveriesCache(
  status: 'pending' | 'active' | 'completed',
  data: unknown[]
): Promise<void> {
  const key = `${DELIVERIES_CACHE_KEY}_${status}`
  const entry: DeliveriesCacheEntry = {
    status,
    data,
    cachedAt: new Date().toISOString(),
  }
  const value = JSON.stringify(entry)
  if (isNative) {
    await Preferences.set({ key, value })
  } else {
    localStorage.setItem(key, value)
  }
}

/**
 * Recupera entregas do cache
 */
export async function getDeliveriesCache(
  status: 'pending' | 'active' | 'completed'
): Promise<unknown[] | null> {
  const key = `${DELIVERIES_CACHE_KEY}_${status}`
  let raw: string | null = null
  if (isNative) {
    const { value } = await Preferences.get({ key })
    raw = value
  } else {
    raw = localStorage.getItem(key)
  }
  if (!raw) return null
  try {
    const entry = JSON.parse(raw) as DeliveriesCacheEntry
    return Array.isArray(entry.data) ? entry.data : null
  } catch {
    return null
  }
}

/**
 * Invalida cache de entregas (após sincronizar fila)
 */
export async function clearDeliveriesCache(): Promise<void> {
  const keys = ['pending', 'active', 'completed'].map(
    (s) => `${DELIVERIES_CACHE_KEY}_${s}`
  )
  if (isNative) {
    await Promise.all(keys.map((key) => Preferences.remove({ key })))
  } else {
    keys.forEach((key) => localStorage.removeItem(key))
  }
}
