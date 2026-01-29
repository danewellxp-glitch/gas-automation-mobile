/**
 * Network Status Banner
 *
 * Mostra banner quando offline ou com conexão instável.
 * UX importante para motoristas em áreas com sinal fraco.
 */

import { IonIcon } from '@ionic/react'
import { cloudOffline, wifi } from 'ionicons/icons'
import { useEffect, useState } from 'react'

interface NetworkStatusProps {
  onRetry?: () => void
}

export function NetworkStatusBanner({ onRetry }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowReconnected(true)
      // Esconde mensagem de reconectado após 3 segundos
      setTimeout(() => setShowReconnected(false), 3000)
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
  }, [])

  // Não mostra nada se online e não acabou de reconectar
  if (isOnline && !showReconnected) {
    return null
  }

  // Banner de reconectado (verde)
  if (isOnline && showReconnected) {
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
        <span>Conexao restabelecida</span>
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
      <span>Sem conexao</span>
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
