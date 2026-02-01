/**
 * Dashboard Page
 *
 * Tela principal do motorista com estatísticas e status.
 * UX otimizada para uso rápido (uma mão, carro parado).
 */

import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonTitle,
  IonToolbar,
  RefresherEventDetail,
} from '@ionic/react'
import {
  calendarOutline,
  carOutline,
  locationOutline,
  timeOutline,
} from 'ionicons/icons'
import { useCallback, useEffect, useState, memo } from 'react'
import { useHistory } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getDriverStats,
  getDriverDeliveries,
  updateDriverStatus,
  getStatusLabel,
  type DriverStats,
  type Delivery,
} from '../services/api'
import { getErrorMessage, isNetworkError } from '../utils/errorHandler'
import { startTracking, stopTracking, isTracking } from '../services/locationTracker'
import { useConfirm, CONFIRM_PRESETS } from '../hooks/useConfirm'
import { DashboardSkeleton } from '../components/Skeletons'
import { ErrorState, OfflineState } from '../components/EmptyState'
import { NetworkStatusBanner } from '../components/NetworkStatus'

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Saudação baseada na hora do dia
 */
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

/**
 * Card de status do motorista (elaborado com gradiente e ícone)
 */
const StatusCard = memo(function StatusCard({
  status,
  updating,
  gpsActive,
  onToggle,
}: {
  status: string
  updating: boolean
  gpsActive: boolean
  onToggle: () => void
}) {
  const isAvailable = status === 'available' || status === 'busy'

  return (
    <IonCard
      className="dashboard-status-card"
      style={{
        background: isAvailable ? 'var(--gradient-primary)' : 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
        color: 'white',
        margin: '0 0 16px',
        borderRadius: 16,
        boxShadow: isAvailable ? '0 8px 24px rgba(16, 185, 129, 0.3)' : '0 4px 16px rgba(100, 116, 139, 0.3)',
      }}
    >
      <IonCardContent style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IonIcon icon={carOutline} style={{ fontSize: 28 }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, opacity: 0.95, fontSize: 14 }}>Seu status</p>
            <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700 }}>
              {isAvailable ? 'Disponível' : 'Offline'}
            </p>
            {gpsActive && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 8,
                  padding: '4px 10px',
                  background: 'rgba(255,255,255,0.25)',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                <span className="gps-pulse" />
                <IonIcon icon={locationOutline} style={{ fontSize: 14 }} />
                GPS ativo
              </div>
            )}
          </div>
        </div>
        <IonButton
          fill="outline"
          color="light"
          size="default"
          style={{ marginTop: 16, '--border-radius': '10px', fontWeight: 600 } as React.CSSProperties}
          disabled={updating}
          onClick={onToggle}
        >
          {updating ? (
            <IonSpinner name="crescent" style={{ width: 18, height: 18 }} />
          ) : isAvailable ? (
            'Ficar offline'
          ) : (
            'Ficar disponível'
          )}
        </IonButton>
      </IonCardContent>
    </IonCard>
  )
})

/**
 * Card de estatística individual (com ícone)
 */
const StatCard = memo(function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: typeof calendarOutline
}) {
  return (
    <IonCard style={{ margin: 0, borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <IonCardContent style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <IonIcon icon={icon} style={{ fontSize: 24, color: 'var(--ion-color-primary)' }} />
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ion-color-medium)', fontWeight: 500 }}>{label}</p>
        </div>
        <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--ion-color-secondary)' }}>{value}</p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ion-color-medium)' }}>entregas</p>
      </IonCardContent>
    </IonCard>
  )
})

/**
 * Card de próxima entrega
 */
const NextDeliveryCard = memo(function NextDeliveryCard({
  delivery,
  onClick,
}: {
  delivery: Delivery
  onClick: () => void
}) {
  const statusColors: Record<string, string> = {
    pending: 'var(--status-pending)',
    assigned: 'var(--status-assigned)',
    in_transit: 'var(--status-in-transit)',
    arrived: 'var(--status-arrived)',
  }
  const statusColor = statusColors[delivery.status] || 'var(--ion-color-medium)'

  return (
    <IonCard button onClick={onClick} style={{ margin: '0 0 16px', borderRadius: 14 }}>
      <IonCardContent style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <IonIcon icon={locationOutline} style={{ fontSize: 20, color: 'var(--ion-color-primary)' }} />
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ion-color-primary)' }}>
            Próxima entrega
          </p>
        </div>
        <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>
          Pedido #{delivery.order_number || delivery.id.slice(0, 8)}
        </h3>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--ion-color-medium)' }}>
          {delivery.delivery_address_str || delivery.bairro || 'Endereço não informado'}
        </p>
        {delivery.bairro && delivery.delivery_address_str && (
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--ion-color-medium)' }}>{delivery.bairro}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 10px',
              background: statusColor,
              color: 'white',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {getStatusLabel(delivery.status)}
          </span>
          {delivery.order_total != null && delivery.order_total > 0 && (
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ion-color-success)' }}>
              R$ {delivery.order_total.toFixed(2)}
            </span>
          )}
        </div>
      </IonCardContent>
    </IonCard>
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
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)

  /**
   * Carrega estatísticas e entregas ativas
   */
  const loadStats = useCallback(async () => {
    try {
      setError(null)
      setIsOffline(false)
      const [statsData, deliveriesData] = await Promise.all([
        getDriverStats(),
        getDriverDeliveries('active'),
      ])
      setStats(statsData)
      setActiveDeliveries(deliveriesData)
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

  // Gerencia GPS tracking baseado no status do driver
  useEffect(() => {
    if (!stats) return

    if (stats.status === 'available' || stats.status === 'busy') {
      if (!isTracking()) {
        startTracking()
      }
    } else {
      stopTracking()
    }

    return () => {
      stopTracking()
    }
  }, [stats?.status])

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
    try {
      const { confirmed } = await confirm(CONFIRM_PRESETS.logout)
      if (!confirmed) return

      await logout()
      // Defer navigation para garantir que React processou o state antes do Login montar
      setTimeout(() => history.replace('/login'), 0)
    } catch (e) {
      // Se confirm falhar, tentar logout direto
      await logout()
      history.replace('/login')
    }
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
            {/* Saudação com hora do dia */}
            {user && (
              <div style={{ marginBottom: 20 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: 'var(--ion-color-medium)',
                    fontWeight: 500,
                  }}
                >
                  {getGreeting()}
                </p>
                <h2
                  style={{
                    margin: '4px 0 0',
                    fontSize: 22,
                    fontWeight: 700,
                    color: 'var(--ion-color-secondary)',
                  }}
                >
                  {user.full_name || user.email}
                </h2>
              </div>
            )}

            {/* Status (com indicador de GPS) */}
            <StatusCard
              status={stats.status}
              updating={statusUpdating}
              gpsActive={isTracking() && (stats.status === 'available' || stats.status === 'busy')}
              onToggle={handleStatusToggle}
            />

            {/* Próxima entrega (se houver ativa) */}
            {activeDeliveries.length > 0 && (
              <NextDeliveryCard
                delivery={activeDeliveries[0]}
                onClick={() => history.push(`/delivery/${activeDeliveries[0].id}`)}
              />
            )}

            {/* Estatísticas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <StatCard
                label="Hoje"
                value={stats.today_deliveries ?? 0}
                icon={timeOutline}
              />
              <StatCard
                label="Semana"
                value={stats.week_deliveries ?? 0}
                icon={calendarOutline}
              />
            </div>

            {/* Navegação */}
            <IonButton
              expand="block"
              routerLink="/deliveries"
              style={{ marginTop: 24, '--border-radius': '12px', height: 52, fontWeight: 600 } as React.CSSProperties}
            >
              Ver entregas
            </IonButton>
          </div>
        )}
      </IonContent>
    </IonPage>
  )
}
