/**
 * Empty State & Error State Components
 *
 * Componentes para estados vazios e de erro.
 * UX clara para quando não há dados ou algo deu errado.
 */

import { IonButton, IonIcon } from '@ionic/react'
import { alertCircleOutline, cloudOfflineOutline, refreshOutline, searchOutline } from 'ionicons/icons'

interface EmptyStateProps {
  icon?: string
  title: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * Componente para estados vazios (sem dados)
 */
export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        textAlign: 'center',
        minHeight: 200,
      }}
    >
      {icon && (
        <IonIcon
          icon={icon}
          style={{
            fontSize: 48,
            color: 'var(--ion-color-medium)',
            marginBottom: 16,
          }}
        />
      )}
      <h3
        style={{
          margin: '0 0 8px',
          color: 'var(--ion-color-dark)',
          fontSize: 18,
          fontWeight: 600,
        }}
      >
        {title}
      </h3>
      {message && (
        <p
          style={{
            margin: '0 0 16px',
            color: 'var(--ion-color-medium)',
            fontSize: 14,
            maxWidth: 280,
          }}
        >
          {message}
        </p>
      )}
      {action && (
        <IonButton fill="outline" onClick={action.onClick}>
          {action.label}
        </IonButton>
      )}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
}

/**
 * Componente para estados de erro
 */
export function ErrorState({
  title = 'Erro',
  message,
  onRetry,
  retryLabel = 'Tentar novamente',
}: ErrorStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        textAlign: 'center',
        minHeight: 200,
      }}
    >
      <IonIcon
        icon={alertCircleOutline}
        style={{
          fontSize: 48,
          color: 'var(--ion-color-danger)',
          marginBottom: 16,
        }}
      />
      <h3
        style={{
          margin: '0 0 8px',
          color: 'var(--ion-color-dark)',
          fontSize: 18,
          fontWeight: 600,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: '0 0 16px',
          color: 'var(--ion-color-medium)',
          fontSize: 14,
          maxWidth: 280,
        }}
      >
        {message}
      </p>
      {onRetry && (
        <IonButton fill="outline" onClick={onRetry}>
          <IonIcon icon={refreshOutline} slot="start" />
          {retryLabel}
        </IonButton>
      )}
    </div>
  )
}

/**
 * Componente para estado offline
 */
export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        textAlign: 'center',
        minHeight: 200,
      }}
    >
      <IonIcon
        icon={cloudOfflineOutline}
        style={{
          fontSize: 48,
          color: 'var(--ion-color-warning)',
          marginBottom: 16,
        }}
      />
      <h3
        style={{
          margin: '0 0 8px',
          color: 'var(--ion-color-dark)',
          fontSize: 18,
          fontWeight: 600,
        }}
      >
        Sem conexao
      </h3>
      <p
        style={{
          margin: '0 0 16px',
          color: 'var(--ion-color-medium)',
          fontSize: 14,
          maxWidth: 280,
        }}
      >
        Verifique sua conexao com a internet e tente novamente.
      </p>
      {onRetry && (
        <IonButton fill="outline" onClick={onRetry}>
          <IonIcon icon={refreshOutline} slot="start" />
          Tentar novamente
        </IonButton>
      )}
    </div>
  )
}

/**
 * Estados pré-configurados para entregas
 */
export const DELIVERY_EMPTY_STATES = {
  active: {
    icon: searchOutline,
    title: 'Nenhuma entrega ativa',
    message: 'Voce nao tem entregas em andamento no momento.',
  },
  pending: {
    icon: searchOutline,
    title: 'Nenhuma entrega pendente',
    message: 'Nao ha novas entregas disponiveis agora.',
  },
  completed: {
    icon: searchOutline,
    title: 'Nenhuma entrega concluida',
    message: 'Suas entregas finalizadas aparecerão aqui.',
  },
} as const
