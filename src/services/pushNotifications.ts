/**
 * Push Notifications Service
 *
 * Registra device token FCM e escuta notificações.
 * Ao receber push de nova entrega, navega para DeliveryDetail.
 */

import { PushNotifications } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core'
import { api } from './api'

let initialized = false

/**
 * Inicializa push notifications e registra token no backend
 */
export async function initPushNotifications(): Promise<void> {
  if (initialized) return
  if (!Capacitor.isNativePlatform()) return

  const permission = await PushNotifications.requestPermissions()
  if (permission.receive !== 'granted') return

  // Registra no sistema de push do OS (FCM/APNs)
  await PushNotifications.register()

  // Quando receber o token do FCM, envia pro backend
  PushNotifications.addListener('registration', async (token) => {
    try {
      await api.put('/drivers/me/push-token', { push_token: token.value })
    } catch {
      // Silencioso - vai tentar novamente no próximo login
    }
  })

  // Erro no registro
  PushNotifications.addListener('registrationError', (error) => {
    console.error('Push registration error:', error)
  })

  // Notificação recebida com app em foreground
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    // Em foreground, mostra como toast/alert nativo do Ionic
    // O app já está aberto, então não precisa navegar
    console.log('Push received in foreground:', notification.title)
  })

  // Usuário clicou na notificação (app em background)
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const data = action.notification.data
    // Se tem delivery_id, navega para o detalhe
    if (data?.delivery_id) {
      window.location.href = `/delivery/${data.delivery_id}`
    } else {
      window.location.href = '/deliveries'
    }
  })

  initialized = true
}

/**
 * Remove listeners ao fazer logout
 */
export async function cleanupPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  await PushNotifications.removeAllListeners()
  initialized = false
}
