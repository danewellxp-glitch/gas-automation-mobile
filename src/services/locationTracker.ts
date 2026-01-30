/**
 * Location Tracker Service
 *
 * Rastreia posição GPS do motorista em tempo real.
 * Envia coordenadas ao backend a cada 30 segundos.
 * Inicia quando status = available/busy, para quando offline.
 */

import { Geolocation, type Position } from '@capacitor/geolocation'
import { Capacitor } from '@capacitor/core'
import { api } from './api'

let watchId: string | null = null
let intervalId: ReturnType<typeof setInterval> | null = null
let lastPosition: { latitude: number; longitude: number } | null = null

const SEND_INTERVAL_MS = 30_000 // 30 segundos

/**
 * Inicia rastreamento GPS
 */
export async function startTracking(): Promise<boolean> {
  if (watchId) return true // Já está rastreando

  try {
    const permission = await Geolocation.requestPermissions()
    if (permission.location !== 'granted') return false

    // Watch contínuo da posição
    watchId = await Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      },
      (position: Position | null) => {
        if (position) {
          lastPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
        }
      }
    )

    // Envia posição ao backend a cada 30s
    intervalId = setInterval(sendLocation, SEND_INTERVAL_MS)

    // Envia posição imediata
    sendLocation()

    return true
  } catch {
    return false
  }
}

/**
 * Para rastreamento GPS
 */
export async function stopTracking(): Promise<void> {
  if (watchId) {
    await Geolocation.clearWatch({ id: watchId })
    watchId = null
  }
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  lastPosition = null
}

/**
 * Envia posição atual ao backend
 */
async function sendLocation(): Promise<void> {
  if (!lastPosition) {
    // Tenta pegar posição atual se watch ainda não retornou
    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 5000,
      })
      lastPosition = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      }
    } catch {
      return
    }
  }

  try {
    await api.put('/drivers/me/location', lastPosition)
  } catch {
    // Falha silenciosa - tenta novamente no próximo intervalo
  }
}

/**
 * Verifica se está rastreando
 */
export function isTracking(): boolean {
  return watchId !== null
}

/**
 * Retorna última posição conhecida
 */
export function getLastPosition(): { latitude: number; longitude: number } | null {
  return lastPosition
}

/**
 * Checa se tem permissão de localização
 */
export async function hasLocationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  try {
    const status = await Geolocation.checkPermissions()
    return status.location === 'granted'
  } catch {
    return false
  }
}
