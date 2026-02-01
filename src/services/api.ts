/**
 * API Service Layer
 *
 * Camada de comunicação com o backend.
 * Inclui: interceptors, retry, tratamento de erros, tipagem forte.
 */

import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import axiosRetry from 'axios-retry'
import { getCachedToken, clearCache } from '../utils/storage'
import { getErrorMessage, isAuthError, logError } from '../utils/errorHandler'

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

/**
 * URL base da API
 * IMPORTANTE: Em produção, usar variável de ambiente
 */
/**
 * URL da API
 * Emulador Android: 10.0.2.2 → Windows host → port forward → Linux backend
 * Device fisico: usar IP direto da rede (192.168.10.156)
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.10.156:8000/api'

/**
 * Timeout padrão (15 segundos - adequado para 3G/4G)
 */
const DEFAULT_TIMEOUT = 15000

/**
 * Instância do Axios configurada
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// ============================================================================
// RETRY EXPONENCIAL
// ============================================================================

/**
 * Configura retry automático com backoff exponencial
 * - 3 tentativas para erros de rede e 5xx
 * - Delay crescente: 1s, 2s, 4s
 * - Não faz retry em 401, 403, 404
 */
axiosRetry(api, {
  retries: 3,
  retryDelay: (retryCount) => {
    // Exponential backoff com jitter
    const delay = Math.pow(2, retryCount - 1) * 1000
    const jitter = Math.random() * 200
    return delay + jitter
  },
  retryCondition: (error: AxiosError) => {
    // Não faz retry em erros de autenticação/autorização
    if (error.response?.status === 401 || error.response?.status === 403) {
      return false
    }
    // Não faz retry em erros de validação (4xx)
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      return false
    }
    // Faz retry em erros de rede e 5xx
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response?.status ?? 0) >= 500
  },
  onRetry: (retryCount, error) => {
    logError('API Retry', `Tentativa ${retryCount}: ${error.message}`)
  },
})

// ============================================================================
// INTERCEPTORS
// ============================================================================

/**
 * Request Interceptor
 * - Adiciona token JWT
 * - Log de requests (apenas em dev)
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getCachedToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    logError('API Request Error', error)
    return Promise.reject(error)
  }
)

/**
 * Response Interceptor
 * - Trata 401 (sessão expirada)
 * - Log de erros
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Sessão expirada - força logout
    if (isAuthError(error)) {
      await clearCache()
      // Redireciona para login (exceto se já estiver lá)
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }

    logError('API Response Error', {
      url: error.config?.url,
      status: error.response?.status,
      message: getErrorMessage(error),
    })

    return Promise.reject(error)
  }
)

// ============================================================================
// TIPOS (INTERFACES)
// ============================================================================

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  role: string
  user: {
    id: number
    username: string
    email: string
    full_name: string
    role: string
    must_change_password?: boolean
  }
}

export interface DriverProfile {
  id: number
  name: string
  phone: string
  status: 'available' | 'offline' | 'busy'
  total_deliveries?: number
  user_id?: number
  created_at?: string
}

export interface DriverStats {
  driver_id: number
  today_deliveries: number
  week_deliveries: number
  month_deliveries: number
  status: 'available' | 'offline' | 'busy'
}

export type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'arrived'
  | 'delivered'
  | 'failed'
  | 'returned'

export interface Delivery {
  id: string
  order_id: string
  order_number?: string
  status: DeliveryStatus
  driver_id?: string
  driver_name?: string
  bairro?: string
  address?: string
  delivery_address_str?: string
  customer_name?: string
  customer_phone?: string
  notes?: string
  order_total?: number
  order_items?: { product_code: string; product_name: string; quantity: number }[]
  assigned_at?: string
  picked_up_at?: string
  in_transit_at?: string
  arrived_at?: string
  delivered_at?: string
  created_at?: string
  updated_at?: string
}

export interface UpdateStatusResponse {
  id: string
  status: DeliveryStatus
  message: string
}

// ============================================================================
// API METHODS
// ============================================================================

/**
 * Login do motorista
 * @throws Error se credenciais inválidas ou não for motorista
 */
export async function loginDriver(credentials: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', credentials)

  // Valida role
  if (data.role !== 'driver') {
    throw new Error('Acesso restrito a entregadores.')
  }

  return data
}

/**
 * Busca perfil do motorista logado
 */
export async function getDriverProfile(): Promise<DriverProfile> {
  const { data } = await api.get<DriverProfile>('/drivers/me')
  return data
}

/**
 * Busca estatísticas do motorista
 */
export async function getDriverStats(): Promise<DriverStats> {
  const { data } = await api.get<DriverStats>('/drivers/me/stats')
  return data
}

/**
 * Atualiza status do motorista (available/offline)
 */
export async function updateDriverStatus(
  status: 'available' | 'offline'
): Promise<DriverProfile> {
  const { data } = await api.put<DriverProfile>('/drivers/me/status', { status })
  return data
}

/**
 * Lista entregas do motorista
 * @param status Filtro opcional: pending, active, completed
 */
export async function getDriverDeliveries(
  status?: 'pending' | 'active' | 'completed'
): Promise<Delivery[]> {
  const params = status ? { status } : {}
  const { data } = await api.get<Delivery[]>('/drivers/me/deliveries', { params })
  return Array.isArray(data) ? data : []
}

/**
 * Busca uma entrega específica
 * @param deliveryId ID da entrega
 */
export async function getDeliveryById(deliveryId: string): Promise<Delivery | null> {
  try {
    // Busca em todas as categorias
    const [active, pending, completed] = await Promise.all([
      getDriverDeliveries('active'),
      getDriverDeliveries('pending'),
      getDriverDeliveries('completed'),
    ])

    return (
      active.find((d) => d.id === deliveryId) ??
      pending.find((d) => d.id === deliveryId) ??
      completed.find((d) => d.id === deliveryId) ??
      null
    )
  } catch {
    return null
  }
}

/**
 * Atualiza status de uma entrega
 */
export async function updateDeliveryStatus(
  deliveryId: string,
  status: DeliveryStatus,
  notes?: string
): Promise<UpdateStatusResponse> {
  const { data } = await api.put<UpdateStatusResponse>(
    `/drivers/deliveries/${deliveryId}/status`,
    { status, notes }
  )
  return data
}

/**
 * Aceita uma entrega pendente
 */
export async function acceptDelivery(
  deliveryId: string
): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(
    `/drivers/deliveries/${deliveryId}/accept`
  )
  return data
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Mapa de status para labels em português
 */
export const STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending: 'Pendente',
  assigned: 'Atribuida',
  picked_up: 'Retirada',
  in_transit: 'Em rota',
  arrived: 'Chegou',
  delivered: 'Entregue',
  failed: 'Falha',
  returned: 'Devolvida',
}

/**
 * Retorna label traduzido do status
 */
export function getStatusLabel(status: DeliveryStatus | string): string {
  return STATUS_LABELS[status as DeliveryStatus] ?? status
}

/**
 * Verifica se um status permite atualização
 */
export function canUpdateStatus(status: DeliveryStatus | string): boolean {
  const updatableStatuses: DeliveryStatus[] = ['assigned', 'picked_up', 'in_transit', 'arrived']
  return updatableStatuses.includes(status as DeliveryStatus)
}
