import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://192.168.10.156:8000/api'

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getStoredUser(): { id: number; email: string; role: string } | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as { id: number; email: string; role: string }
  } catch {
    return null
  }
}

export function setStoredUser(user: { id: number; email: string; role: string }): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredAuth()
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// --- Auth (backend: POST /api/auth/login) ---
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

export async function loginDriver(credentials: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', credentials)
  if (data.role !== 'driver') {
    throw new Error('Acesso restrito a entregadores.')
  }
  return data
}

// --- Driver profile (GET /api/drivers/me) ---
export interface DriverProfile {
  id: number
  name: string
  phone: string
  status: string
  total_deliveries?: number
  [key: string]: unknown
}

export async function getDriverProfile(): Promise<DriverProfile> {
  const { data } = await api.get<DriverProfile>('/drivers/me')
  return data
}

// --- Driver stats (GET /api/drivers/me/stats) ---
export interface DriverStats {
  driver_id: number
  today_deliveries: number
  week_deliveries: number
  month_deliveries: number
  status: string
  [key: string]: unknown
}

export async function getDriverStats(): Promise<DriverStats> {
  const { data } = await api.get<DriverStats>('/drivers/me/stats')
  return data
}

// --- Driver status (PUT /api/drivers/me/status) ---
export async function updateDriverStatus(status: string): Promise<DriverProfile> {
  const { data } = await api.put<DriverProfile>('/drivers/me/status', { status })
  return data
}

// --- Deliveries (GET /api/drivers/me/deliveries) ---
export interface Delivery {
  id: string
  order_id: string
  status: string
  driver_id?: number
  driver_name?: string
  bairro?: string
  address?: string
  customer_name?: string
  created_at?: string
  [key: string]: unknown
}

export async function getDriverDeliveries(status?: 'pending' | 'active' | 'completed'): Promise<Delivery[]> {
  const params = status ? { status } : {}
  const { data } = await api.get<Delivery[]>('/drivers/me/deliveries', { params })
  return Array.isArray(data) ? data : []
}

// --- Update delivery status (PUT /api/drivers/deliveries/:id/status) ---
export async function updateDeliveryStatus(
  deliveryId: string,
  status: string,
  notes?: string
): Promise<{ id: string; status: string; message: string }> {
  const { data } = await api.put<{ id: string; status: string; message: string }>(
    `/drivers/deliveries/${deliveryId}/status`,
    { status, notes }
  )
  return data
}

// --- Accept delivery (POST /api/drivers/deliveries/:id/accept) ---
export async function acceptDelivery(deliveryId: string): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(`/drivers/deliveries/${deliveryId}/accept`)
  return data
}
