/**
 * Network Utilities
 *
 * Retry exponencial, detecção de conectividade, etc.
 */

import { AxiosError } from 'axios'

/**
 * Configuração de retry
 */
export interface RetryConfig {
  maxRetries: number
  baseDelay: number // ms
  maxDelay: number // ms
  retryCondition?: (error: AxiosError) => boolean
}

/**
 * Configuração padrão para retry
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryCondition: shouldRetry,
}

/**
 * Determina se um erro deve resultar em retry
 */
export function shouldRetry(error: AxiosError): boolean {
  // Não faz retry em erros de autenticação
  if (error.response?.status === 401) return false

  // Não faz retry em erros de validação (4xx exceto 408, 429)
  if (error.response?.status) {
    const status = error.response.status
    if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
      return false
    }
  }

  // Retry em erros de rede
  if (
    error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    !error.response
  ) {
    return true
  }

  // Retry em erros de servidor (5xx) e rate limit (429)
  if (error.response?.status) {
    const status = error.response.status
    return status >= 500 || status === 429 || status === 408
  }

  return false
}

/**
 * Calcula delay com exponential backoff + jitter
 */
export function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt)

  // Jitter: adiciona variação aleatória de até 20%
  const jitter = exponentialDelay * 0.2 * Math.random()

  // Limita ao maxDelay
  return Math.min(exponentialDelay + jitter, maxDelay)
}

/**
 * Aguarda um tempo específico
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Executa uma função com retry exponencial
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay, retryCondition } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Verifica se deve fazer retry
      const shouldTryAgain =
        attempt < maxRetries &&
        error instanceof AxiosError &&
        retryCondition?.(error)

      if (!shouldTryAgain) {
        throw error
      }

      // Calcula e aguarda o delay
      const delay = calculateDelay(attempt, baseDelay, maxDelay)
      await sleep(delay)
    }
  }

  throw lastError
}

/**
 * Estado de conectividade
 */
export interface NetworkStatus {
  connected: boolean
  connectionType: string
}

/**
 * Obtém status atual da rede
 * Usa navigator.onLine como fallback universal
 */
export async function getNetworkStatus(): Promise<NetworkStatus> {
  return {
    connected: navigator.onLine,
    connectionType: navigator.onLine ? 'unknown' : 'none',
  }
}

/**
 * Verifica se está online
 */
export async function isOnline(): Promise<boolean> {
  const status = await getNetworkStatus()
  return status.connected
}
