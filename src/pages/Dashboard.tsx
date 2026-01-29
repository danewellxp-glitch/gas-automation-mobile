/**
 * Dashboard Page
 *
 * Tela principal do motorista com estatísticas e status.
 * UX otimizada para uso rápido (uma mão, carro parado).
 */

import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonTitle,
  IonToolbar,
  RefresherEventDetail,
} from '@ionic/react'
import { useCallback, useEffect, useState, memo } from 'react'
import { useHistory } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDriverStats, updateDriverStatus, type DriverStats } from '../services/api'
import { getErrorMessage, isNetworkError } from '../utils/errorHandler'
import { useConfirm, CONFIRM_PRESETS } from '../hooks/useConfirm'
import { DashboardSkeleton } from '../components/Skeletons'
import { ErrorState, OfflineState } from '../components/EmptyState'
import { NetworkStatusBanner } from '../components/NetworkStatus'

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Card de status do motorista
 */
const StatusCard = memo(function StatusCard({
  status,
  updating,
  onToggle,
}: {
  status: string
  updating: boolean
  onToggle: () => void
}) {
  const isAvailable = status === 'available'

  return (
    <div
      style={{
        background: isAvailable ? 'var(--ion-color-success)' : 'var(--ion-color-medium)',
        color: 'white',
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
      }}
    >
      <p style={{ margin: 0, opacity: 0.9, fontSize: 14 }}>Seu status</p>
      <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 600 }}>
        {isAvailable ? 'Disponivel' : 'Offline'}
      </p>
      <IonButton
        fill="outline"
        color="light"
        size="small"
        style={{ marginTop: 12 }}
        disabled={updating}
        onClick={onToggle}
      >
        {updating ? (
          <IonSpinner name="crescent" style={{ width: 16, height: 16 }} />
        ) : isAvailable ? (
          'Ficar offline'
        ) : (
          'Ficar disponivel'
        )}
      </IonButton>
    </div>
  )
})

/**
 * Card de estatística individual
 */
const StatCard = memo(function StatCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div style={{ background: 'var(--ion-color-light)', padding: 16, borderRadius: 12 }}>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--ion-color-medium)' }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 700, color: 'var(--ion-color-dark)' }}>
        {value}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--ion-color-medium)' }}>entregas</p>
    </div>
  )
})

// ============================================================================
// PAGE
// ============================================================================

export default function Dashboard() {
  const history = useHistory()
  const { user, logout } = useAuth()
  const { confirm } = useConfirm()

  const [stats, setStats] = useState<DriverStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)

  /**
   * Carrega estatísticas
   */
  const loadStats = useCallback(async () => {
    try {
      setError(null)
      setIsOffline(false)
      const data = await getDriverStats()
      setStats(data)
    } catch (e: unknown) {
      if (isNetworkError(e)) {
        setIsOffline(true)
      }
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  /**
   * Pull-to-refresh
   */
  const onRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadStats()
    event.detail.complete()
  }

  /**
   * Toggle de status com confirmação
   */
  const handleStatusToggle = async () => {
    if (!stats) return

    const goingOffline = stats.status === 'available'

    // Confirma se está ficando offline
    if (goingOffline) {
      const { confirmed } = await confirm(CONFIRM_PRESETS.goOffline)
      if (!confirmed) return
    }

    const nextStatus = goingOffline ? 'offline' : 'available'
    setStatusUpdating(true)

    try {
      await updateDriverStatus(nextStatus)
      await loadStats()
    } catch (e: unknown) {
      setError(getErrorMessage(e))
    } finally {
      setStatusUpdating(false)
    }
  }

  /**
   * Logout com confirmação
   */
  const handleLogout = async () => {
    const { confirmed } = await confirm(CONFIRM_PRESETS.logout)
    if (!confirmed) return

    await logout()
    history.replace('/login')
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Gas Driver</IonTitle>
          <IonButton slot="end" fill="clear" onClick={handleLogout}>
            Sair
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <NetworkStatusBanner onRetry={loadStats} />

        <IonRefresher slot="fixed" onIonRefresh={onRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Loading State */}
        {loading && <DashboardSkeleton />}

        {/* Offline State */}
        {!loading && isOffline && <OfflineState onRetry={loadStats} />}

        {/* Error State */}
        {!loading && !isOffline && error && (
          <ErrorState message={error} onRetry={loadStats} />
        )}

        {/* Success State */}
        {!loading && !error && stats && (
          <div className="ion-padding">
            {/* Saudação */}
            {user && (
              <p style={{ marginBottom: 16, color: 'var(--ion-color-medium)', fontSize: 16 }}>
                Ola, {user.full_name || user.email}
              </p>
            )}

            {/* Status */}
            <StatusCard
              status={stats.status}
              updating={statusUpdating}
              onToggle={handleStatusToggle}
            />

            {/* Estatísticas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <StatCard label="Hoje" value={stats.today_deliveries ?? 0} />
              <StatCard label="Semana" value={stats.week_deliveries ?? 0} />
            </div>

            {/* Navegação */}
            <IonButton expand="block" routerLink="/deliveries" style={{ marginTop: 24 }}>
              Ver entregas
            </IonButton>
          </div>
        )}
      </IonContent>
    </IonPage>
  )
}
