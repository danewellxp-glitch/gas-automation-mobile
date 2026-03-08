/**
 * Dashboard — Dark Theme
 * Layout estilo DoorDash/Uber Eats driver: dark + laranja
 */

import {
  IonButton,
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
  chevronForwardOutline,
  locationOutline,
  logOutOutline,
  timeOutline,
  busOutline,
  flashOutline,
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
// HELPERS
// ============================================================================

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

// ============================================================================
// COMPONENTS
// ============================================================================

/** Card de status do motorista */
const StatusCard = memo(function StatusCard({
  status, updating, gpsActive, onToggle,
}: { status: string; updating: boolean; gpsActive: boolean; onToggle: () => void }) {
  const isAvailable = status === 'available' || status === 'busy'

  return (
    <div style={{
      borderRadius: 20,
      padding: '20px 20px 16px',
      marginBottom: 20,
      background: isAvailable
        ? 'linear-gradient(135deg, #FF6B35 0%, #E55A26 100%)'
        : 'linear-gradient(135deg, #252D3D 0%, #1A1F2E 100%)',
      boxShadow: isAvailable
        ? '0 8px 32px rgba(255, 107, 53, 0.35)'
        : '0 4px 16px rgba(0,0,0,0.4)',
      border: isAvailable ? 'none' : '1px solid rgba(255,255,255,0.07)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decoração de fundo */}
      {isAvailable && (
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 140, height: 140,
          borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: isAvailable ? 'rgba(255,255,255,0.22)' : 'rgba(255,107,53,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <IonIcon icon={busOutline} style={{ fontSize: 28, color: isAvailable ? 'white' : '#FF6B35' }} />
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, color: isAvailable ? 'rgba(255,255,255,0.75)' : '#8B9AB0', fontWeight: 500 }}>
            Seu status
          </p>
          <p style={{ margin: '3px 0 0', fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: -0.3 }}>
            {isAvailable ? 'Disponível' : 'Offline'}
          </p>
          {gpsActive && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6,
              padding: '3px 10px', background: 'rgba(255,255,255,0.2)', borderRadius: 20,
              fontSize: 12, fontWeight: 600, color: 'white',
            }}>
              <span className="gps-pulse" />
              <IonIcon icon={locationOutline} style={{ fontSize: 13 }} />
              GPS ativo
            </div>
          )}
        </div>
      </div>

      <button
        disabled={updating}
        onClick={onToggle}
        style={{
          marginTop: 16, width: '100%', height: 46, borderRadius: 12,
          border: isAvailable ? '2px solid rgba(255,255,255,0.4)' : '1.5px solid rgba(255,107,53,0.4)',
          background: isAvailable ? 'rgba(255,255,255,0.15)' : 'rgba(255,107,53,0.12)',
          color: isAvailable ? 'white' : '#FF6B35',
          fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative',
        }}
      >
        {updating
          ? <IonSpinner name="crescent" style={{ width: 20, height: 20 }} />
          : isAvailable ? 'Ficar offline' : 'Ficar disponível'}
      </button>
    </div>
  )
})

/** Card de estatística clicável */
const StatCard = memo(function StatCard({
  label, value, icon, onClick,
}: { label: string; value: number; icon: typeof calendarOutline; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      background: '#1A1F2E', borderRadius: 18, padding: 18,
      border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer',
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    }}>
      {/* Glow de fundo */}
      <div style={{
        position: 'absolute', bottom: -20, right: -20, width: 80, height: 80,
        borderRadius: '50%', background: 'rgba(255,107,53,0.12)',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11, background: 'rgba(255,107,53,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IonIcon icon={icon} style={{ fontSize: 20, color: '#FF6B35' }} />
        </div>
        <p style={{ margin: 0, fontSize: 13, color: '#8B9AB0', fontWeight: 600 }}>{label}</p>
      </div>

      <p style={{ margin: 0, fontSize: 38, fontWeight: 800, color: 'white', lineHeight: 1 }}>{value}</p>
      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#4B5A6E' }}>
        OS{value !== 1 ? 's' : ''} concluída{value !== 1 ? 's' : ''}
      </p>

      <div style={{
        position: 'absolute', bottom: 14, right: 14, width: 26, height: 26,
        borderRadius: '50%', background: 'rgba(255,107,53,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <IonIcon icon={chevronForwardOutline} style={{ fontSize: 15, color: '#FF6B35' }} />
      </div>
    </div>
  )
})

/** Próxima OS ativa */
const NextOSCard = memo(function NextOSCard({
  delivery, onClick,
}: { delivery: Delivery; onClick: () => void }) {
  const statusColors: Record<string, string> = {
    pending: '#FBBF24', assigned: '#60A5FA', in_transit: '#A78BFA', arrived: '#34D399',
  }
  const statusColor = statusColors[delivery.status] || '#8B9AB0'
  const osNumber = delivery.order_number || String(delivery.order_id || delivery.id).slice(0, 8)

  return (
    <div onClick={onClick} style={{
      background: '#1A1F2E', borderRadius: 20, marginBottom: 20,
      border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer',
      boxShadow: '0 4px 20px rgba(0,0,0,0.35)', overflow: 'hidden',
    }}>
      {/* Barra superior colorida */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${statusColor}, ${statusColor}88)` }} />

      <div style={{ padding: '16px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <IonIcon icon={flashOutline} style={{ fontSize: 14, color: statusColor }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, textTransform: 'uppercase', letterSpacing: 1.2 }}>
            Próxima OS
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 15, flexShrink: 0,
            background: `${statusColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1.5px solid ${statusColor}44`,
          }}>
            <IonIcon icon={locationOutline} style={{ fontSize: 24, color: statusColor }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 19, fontWeight: 800, color: 'white' }}>
              OS #{osNumber}
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: '#8B9AB0', lineHeight: 1.4 }}>
              {delivery.delivery_address_str || delivery.bairro || 'Endereço não informado'}
            </p>
            {delivery.customer_name && (
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#c0cad4', fontWeight: 500 }}>
                {delivery.customer_name}
              </p>
            )}
          </div>

          <IonIcon icon={chevronForwardOutline} style={{ fontSize: 20, color: '#4B5A6E', flexShrink: 0 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
          <span style={{
            padding: '5px 12px', background: `${statusColor}22`, color: statusColor,
            borderRadius: 10, fontSize: 12, fontWeight: 700, border: `1px solid ${statusColor}44`,
          }}>
            {getStatusLabel(delivery.status)}
          </span>
          {delivery.order_total != null && delivery.order_total > 0 && (
            <span style={{ fontSize: 15, fontWeight: 700, color: '#10B981' }}>
              R$ {delivery.order_total.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
})

// ============================================================================
// PAGE
// ============================================================================

export default function Dashboard() {
  const history = useHistory()
  const { user, logout, truckPlate } = useAuth()
  const { confirm } = useConfirm()

  const [stats, setStats] = useState<DriverStats | null>(null)
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)

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
      if (isNetworkError(e)) setIsOffline(true)
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  // Polling 30s para novas OSs
  useEffect(() => {
    const interval = setInterval(() => { loadStats() }, 30000)
    return () => clearInterval(interval)
  }, [loadStats])

  useEffect(() => {
    if (!stats) return
    if (stats.status === 'available' || stats.status === 'busy') {
      if (!isTracking()) startTracking()
    } else {
      stopTracking()
    }
    return () => { stopTracking() }
  }, [stats?.status])

  const onRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadStats()
    event.detail.complete()
  }

  const handleStatusToggle = async () => {
    if (!stats) return
    const goingOffline = stats.status === 'available'
    if (goingOffline) {
      const { confirmed } = await confirm(CONFIRM_PRESETS.goOffline)
      if (!confirmed) return
    }
    setStatusUpdating(true)
    try {
      await updateDriverStatus(goingOffline ? 'offline' : 'available')
      await loadStats()
    } catch (e: unknown) {
      setError(getErrorMessage(e))
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleLogout = async () => {
    try {
      const { confirmed } = await confirm(CONFIRM_PRESETS.logout)
      if (!confirmed) return
      await logout()
      setTimeout(() => history.replace('/login'), 0)
    } catch {
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
          <IonTitle style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>Gas Driver</IonTitle>
          <IonButton slot="end" fill="clear" onClick={handleLogout}
            style={{ '--color': '#8B9AB0' } as React.CSSProperties}>
            <IonIcon icon={logOutOutline} slot="icon-only" style={{ fontSize: 22 }} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <NetworkStatusBanner onRetry={loadStats} />
        <IonRefresher slot="fixed" onIonRefresh={onRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {loading && <DashboardSkeleton />}
        {!loading && isOffline && <OfflineState onRetry={loadStats} />}
        {!loading && !isOffline && error && <ErrorState message={error} onRetry={loadStats} />}

        {!loading && !error && stats && (
          <div style={{ padding: '20px 16px 40px' }}>

            {/* Saudação + motorista */}
            {user && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ margin: 0, fontSize: 14, color: '#8B9AB0', fontWeight: 500 }}>
                  {getGreeting()}
                </p>
                <h2 style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, color: 'white', letterSpacing: -0.5 }}>
                  {user.full_name || user.email}
                </h2>

                {/* Placa */}
                {truckPlate && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12,
                    padding: '7px 16px', background: 'rgba(255,107,53,0.12)',
                    border: '1.5px solid rgba(255,107,53,0.35)', borderRadius: 12,
                  }}>
                    <IonIcon icon={carOutline} style={{ fontSize: 17, color: '#FF6B35' }} />
                    <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: 2.5, color: '#FF6B35' }}>
                      {truckPlate}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Status */}
            <StatusCard
              status={stats.status}
              updating={statusUpdating}
              gpsActive={isTracking() && (stats.status === 'available' || stats.status === 'busy')}
              onToggle={handleStatusToggle}
            />

            {/* Próxima OS */}
            {activeDeliveries.length > 0 && (
              <NextOSCard
                delivery={activeDeliveries[0]}
                onClick={() => history.push(`/delivery/${activeDeliveries[0].id}`)}
              />
            )}

            {/* Label seção stats */}
            <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#4B5A6E', textTransform: 'uppercase', letterSpacing: 1.2 }}>
              Suas OSs
            </p>

            {/* Grid de estatísticas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <StatCard label="Hoje" value={stats.today_deliveries ?? 0} icon={timeOutline}
                onClick={() => history.push('/deliveries/history?period=today')} />
              <StatCard label="Semana" value={stats.week_deliveries ?? 0} icon={calendarOutline}
                onClick={() => history.push('/deliveries/history?period=week')} />
            </div>

            {/* Botão Ver OSs */}
            <button
              onClick={() => history.push('/deliveries')}
              style={{
                width: '100%', height: 58, borderRadius: 16,
                background: 'linear-gradient(135deg, #FF6B35 0%, #E55A26 100%)',
                border: 'none', color: 'white', fontWeight: 800, fontSize: 17,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 10, boxShadow: '0 8px 28px rgba(255,107,53,0.4)',
                letterSpacing: 0.3,
              }}
            >
              <IonIcon icon={locationOutline} style={{ fontSize: 22 }} />
              Ver todas as OSs
            </button>
          </div>
        )}
      </IonContent>
    </IonPage>
  )
}
