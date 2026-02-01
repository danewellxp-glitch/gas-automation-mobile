/**
 * Offline Queue Service
 *
 * Enfileira ações do motorista quando offline e sincroniza ao reconectar.
 * Persiste em Capacitor Preferences (sobrevive reinício).
 */

import { Preferences } from '@capacitor/preferences'
import { Capacitor } from '@capacitor/core'

const QUEUE_KEY = 'gas_driver_offline_queue'
const MAX_RETRIES = 3
const isNative = Capacitor.isNativePlatform()

export type QueuedActionType =
  | 'status_update'
  | 'location_update'
  | 'accept_delivery'
  | 'delivery_status_update'

export interface QueuedAction {
  id: string
  type: QueuedActionType
  endpoint: string
  method: 'PUT' | 'POST'
  payload: unknown
  createdAt: string
  retries: number
}

type QueueListener = (count: number) => void
const listeners: Set<QueueListener> = new Set()

async function loadQueue(): Promise<QueuedAction[]> {
  if (isNative) {
    const { value } = await Preferences.get({ key: QUEUE_KEY })
    if (!value) return []
    try {
      return JSON.parse(value) as QueuedAction[]
    } catch {
      return []
    }
  }
  const raw = localStorage.getItem(QUEUE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as QueuedAction[]
  } catch {
    return []
  }
}

async function saveQueue(queue: QueuedAction[]): Promise<void> {
  const value = JSON.stringify(queue)
  if (isNative) {
    await Preferences.set({ key: QUEUE_KEY, value })
  } else {
    localStorage.setItem(QUEUE_KEY, value)
  }
  listeners.forEach((fn) => fn(queue.length))
}

function generateId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Adiciona ação à fila.
 * Para location_update, substitui o anterior (só o último importa).
 */
export async function addToQueue(
  type: QueuedActionType,
  endpoint: string,
  method: 'PUT' | 'POST',
  payload: unknown
): Promise<string> {
  let queue = await loadQueue()
  if (type === 'location_update') {
    queue = queue.filter((a) => a.type !== 'location_update')
  }
  const action: QueuedAction = {
    id: generateId(),
    type,
    endpoint,
    method,
    payload,
    createdAt: new Date().toISOString(),
    retries: 0,
  }
  queue.push(action)
  await saveQueue(queue)
  return action.id
}

/**
 * Retorna quantidade de ações na fila
 */
export async function getQueueCount(): Promise<number> {
  const queue = await loadQueue()
  return queue.length
}

/**
 * Retorna a fila completa (para exibição)
 */
export async function getQueue(): Promise<QueuedAction[]> {
  return loadQueue()
}

/**
 * Remove ação da fila
 */
async function removeFromQueue(id: string): Promise<void> {
  const queue = await loadQueue()
  const filtered = queue.filter((a) => a.id !== id)
  await saveQueue(filtered)
}

/**
 * Incrementa retries e remove se exceder máximo
 */
async function incrementRetries(id: string): Promise<boolean> {
  const queue = await loadQueue()
  const action = queue.find((a) => a.id === id)
  if (!action) return false
  action.retries += 1
  if (action.retries >= MAX_RETRIES) {
    const filtered = queue.filter((a) => a.id !== id)
    await saveQueue(filtered)
    return false
  }
  await saveQueue(queue)
  return true
}

/**
 * Processa uma ação da fila (chamada pelo processador)
 */
export async function processAction(
  action: QueuedAction,
  apiRequest: (endpoint: string, method: string, payload: unknown) => Promise<unknown>
): Promise<{ ok: boolean; discard: boolean }> {
  try {
    await apiRequest(action.endpoint, action.method, action.payload)
    await removeFromQueue(action.id)
    return { ok: true, discard: false }
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 409) {
      await removeFromQueue(action.id)
      return { ok: false, discard: true }
    }
    const retry = await incrementRetries(action.id)
    return { ok: false, discard: !retry }
  }
}

/**
 * Processa toda a fila FIFO
 */
export async function processQueue(
  apiRequest: (endpoint: string, method: string, payload: unknown) => Promise<unknown>,
  onProgress?: (current: number, total: number, ok: boolean, discard: boolean) => void
): Promise<{ success: number; failed: number; discarded: number }> {
  const queue = await loadQueue()
  let success = 0
  let failed = 0
  let discarded = 0
  const total = queue.length

  for (let i = 0; i < queue.length; i++) {
    const action = queue[i]
    const result = await processAction(action, apiRequest)
    if (result.ok) {
      success++
      onProgress?.(i + 1, total, true, false)
    } else if (result.discard) {
      discarded++
      onProgress?.(i + 1, total, false, true)
    } else {
      failed++
      onProgress?.(i + 1, total, false, false)
    }
  }

  return { success, failed, discarded }
}

/**
 * Invalida/limpa a fila (ex: após logout)
 */
export async function clearQueue(): Promise<void> {
  await saveQueue([])
}

/**
 * Inscreve para mudanças no tamanho da fila
 */
export function subscribeToQueue(fn: QueueListener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
