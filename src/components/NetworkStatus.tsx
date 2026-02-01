/**
 * Network Status Banner
 *
 * Mostra banner quando offline ou com conexão instável.
 * Badge de ações pendentes na fila offline.
 * Sincronização ao reconectar.
 */

import { IonIcon } from '@ionic/react'
import { cloudOffline, refreshOutline, wifi } from 'ionicons/icons'
import { useCallback, useEffect, useState } from 'react'
import { useIonToast } from '@ionic/react'
import {
  getQueueCount,
  processQueue,
  subscribeToQueue,
} from '../services/offlineQueue'
import { executeQueuedRequest, clearDeliveriesCache } from '../services/api'

interface NetworkStatusProps {
  onRetry?: () => void
}

export function NetworkStatusBanner({ onRetry }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showReconnected, setShowReconnected] = useState(false)
  const [queueCount, setQueueCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [presentToast] = useIonToast()

  const syncQueue = useCallback(async () => {
    if (!navigator.onLine || syncing || queueCount === 0) return
    setSyncing(true)
    try {
      const result = await processQueue(executeQueuedRequest)
      if (result.success > 0) {
        await clearDeliveriesCache()
      }
      if (result.success > 0 || result.failed > 0 || result.discarded > 0) {
        const msg =
          result.failed > 0
            ? `${result.success} sincronizado(s) | ${result.failed} falha(s)`
            : `${result.success} ação(ões) sincronizada(s)`
        presentToast({
          message: msg,
          duration: 2500,
          color: result.failed > 0 ? 'warning' : 'success',
          position: 'top',
        })
      }
      onRetry?.()
    } catch (e) {
      presentToast({
        message: 'Erro ao sincronizar',
        duration: 2000,
        color: 'danger',
        position: 'top',
      })
    } finally {
      setSyncing(false)
    }
  }, [queueCount, syncing, onRetry, presentToast])

  useEffect(() => {
    let cancelled = false
    getQueueCount().then((c) => !cancelled && setQueueCount(c))
    const unsub = subscribeToQueue((c) => setQueueCount(c))
    return () => {
      cancelled = true
      unsub()
    }
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowReconnected(true)
      setTimeout(() => setShowReconnected(false), 3000)
      syncQueue()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowReconnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [queueCount, syncQueue])

  // Não mostra nada se online, sem pendentes e não acabou de reconectar
  if (isOnline && !showReconnected && queueCount === 0) {
    return null
  }

  // Banner de reconectado / sincronizando (verde)
  if (isOnline && (showReconnected || syncing)) {
    return (
      <div
        style={{
          background: 'var(--ion-color-success)',
          color: 'white',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontSize: 14,
        }}
      >
        <IonIcon icon={wifi} />
        <span>{syncing ? `Sincronizando...` : 'Conexão restabelecida'}</span>
      </div>
    )
  }

  // Banner quando online mas tem ações pendentes
  if (isOnline && queueCount > 0 && !syncing) {
    return (
      <div
        style={{
          background: 'var(--ion-color-primary)',
          color: 'white',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontSize: 14,
        }}
      >
        <span>{queueCount} ação(ões) pendente(s)</span>
        <button
          onClick={syncQueue}
          disabled={syncing}
          style={{
            background: 'rgba(255,255,255,0.25)',
            border: 'none',
            borderRadius: 6,
            padding: '6px 12px',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <IonIcon icon={refreshOutline} style={{ fontSize: 16 }} />
          Sincronizar
        </button>
      </div>
    )
  }

  // Banner de offline (vermelho/warning)
  return (
    <div
      style={{
        background: 'var(--ion-color-warning)',
        color: 'var(--ion-color-warning-contrast)',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontSize: 14,
      }}
    >
      <IonIcon icon={cloudOffline} />
      <span>Sem conexão</span>
      {queueCount > 0 && (
        <span style={{ opacity: 0.9 }}>({queueCount} pendente{queueCount !== 1 ? 's' : ''})</span>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: 4,
            padding: '4px 8px',
            marginLeft: 8,
            color: 'inherit',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Tentar novamente
        </button>
      )}
    </div>
  )
}

export default NetworkStatusBanner
