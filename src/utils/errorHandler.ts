/**
 * Error Handler Centralizado
 *
 * Mapeia erros técnicos para mensagens amigáveis ao motorista.
 * Suporta erros HTTP, de rede e genéricos.
 */

import { AxiosError } from 'axios'

/**
 * Códigos de erro conhecidos do backend
 */
interface ApiErrorResponse {
  detail?: string
  message?: string
  error?: string
  code?: string
}

/**
 * Mapeamento de códigos HTTP para mensagens amigáveis
 */
const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'Dados inválidos. Verifique as informações e tente novamente.',
  401: 'Sessão expirada. Faça login novamente.',
  403: 'Você não tem permissão para esta ação.',
  404: 'Informação não encontrada.',
  408: 'Tempo esgotado. Verifique sua conexão.',
  409: 'Esta ação já foi realizada.',
  422: 'Dados inválidos. Verifique os campos.',
  429: 'Muitas tentativas. Aguarde um momento.',
  500: 'Erro no servidor. Tente novamente em instantes.',
  502: 'Servidor indisponível. Tente novamente.',
  503: 'Serviço temporariamente indisponível.',
  504: 'Servidor demorou para responder. Tente novamente.',
}

/**
 * Mapeamento de mensagens específicas do backend
 */
const BACKEND_ERROR_MESSAGES: Record<string, string> = {
  'Invalid credentials': 'E-mail ou senha incorretos.',
  'User not found': 'Usuário não encontrado.',
  'Token expired': 'Sessão expirada. Faça login novamente.',
  'Token invalid': 'Sessão inválida. Faça login novamente.',
  'Delivery not found': 'Entrega não encontrada.',
  'Delivery already accepted': 'Entrega já foi aceita por outro motorista.',
  'Delivery already completed': 'Entrega já foi concluída.',
  'Driver not available': 'Você precisa estar disponível para aceitar entregas.',
  'Invalid status transition': 'Status não pode ser alterado para este valor.',
  'Unauthorized': 'Acesso não autorizado.',
  'Forbidden': 'Ação não permitida.',
}

/**
 * Verifica se é um erro de rede/conexão
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return (
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      error.message.includes('Network Error') ||
      !error.response
    )
  }
  return false
}

/**
 * Verifica se é erro de timeout
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
  }
  return false
}

/**
 * Verifica se é erro de autenticação (401)
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 401
  }
  return false
}

/**
 * Extrai mensagem amigável de qualquer erro
 */
export function getErrorMessage(error: unknown): string {
  // Erro de rede sem resposta
  if (isNetworkError(error)) {
    if (isTimeoutError(error)) {
      return 'Conexão lenta. Verifique sua internet e tente novamente.'
    }
    return 'Sem conexão. Verifique sua internet e tente novamente.'
  }

  // Erro Axios com resposta
  if (error instanceof AxiosError && error.response) {
    const status = error.response.status
    const data = error.response.data as ApiErrorResponse | undefined

    // Tenta extrair mensagem do backend
    const backendMessage = data?.detail || data?.message || data?.error

    // Verifica se temos tradução para a mensagem do backend
    if (backendMessage && BACKEND_ERROR_MESSAGES[backendMessage]) {
      return BACKEND_ERROR_MESSAGES[backendMessage]
    }

    // Se a mensagem do backend parece amigável (sem termos técnicos), usa ela
    if (backendMessage && !containsTechnicalTerms(backendMessage)) {
      return backendMessage
    }

    // Fallback para mensagem por código HTTP
    if (HTTP_ERROR_MESSAGES[status]) {
      return HTTP_ERROR_MESSAGES[status]
    }

    // Erro HTTP genérico
    return `Erro inesperado (${status}). Tente novamente.`
  }

  // Erro JavaScript genérico
  if (error instanceof Error) {
    // Verifica se já é uma mensagem amigável
    if (!containsTechnicalTerms(error.message)) {
      return error.message
    }
  }

  // Fallback final
  return 'Ocorreu um erro. Tente novamente.'
}

/**
 * Verifica se a mensagem contém termos técnicos
 */
function containsTechnicalTerms(message: string): boolean {
  const technicalPatterns = [
    /exception/i,
    /stack/i,
    /trace/i,
    /null/i,
    /undefined/i,
    /TypeError/i,
    /ReferenceError/i,
    /SyntaxError/i,
    /Error:/i,
    /at line/i,
    /Cannot read/i,
    /is not a function/i,
    /ECONNREFUSED/i,
    /ETIMEDOUT/i,
    /ENOTFOUND/i,
    /\\n/,
    /failed to fetch/i,
  ]

  return technicalPatterns.some((pattern) => pattern.test(message))
}

/**
 * Log de erro para desenvolvimento (não mostra em produção)
 * IMPORTANTE: Não loga tokens ou dados sensíveis
 */
export function logError(context: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error)
  }
  // Em produção, aqui poderia enviar para Sentry/LogRocket
  // NUNCA logar: tokens, senhas, dados pessoais
}

/**
 * Tipos de erro para UI
 */
export type ErrorSeverity = 'info' | 'warning' | 'error'

export function getErrorSeverity(error: unknown): ErrorSeverity {
  if (isNetworkError(error)) return 'warning'
  if (error instanceof AxiosError) {
    const status = error.response?.status
    if (status && status >= 500) return 'error'
    if (status === 429) return 'warning'
  }
  return 'error'
}
