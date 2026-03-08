/**
 * Dashboard — Map-First Layout (Uber Style)
 * Full-screen map with floating Top UI and Bottom Sheet.
 */

import {
  IonContent,
  IonIcon,
  IonPage,
  IonSpinner,
} from '@ionic/react'
import {
  calendarOutline,
  chevronForwardOutline,
  locationOutline,
  logOutOutline,
  timeOutline,
  menuOutline
} from 'ionicons/icons'
import { useCallback, useEffect, useState, memo } from 'react'
import { useHistory } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getDriverStats,
  getDriverDeliveries,
  updateDriverStatus,
  type DriverStats,
  type Delivery,
} from '../services/api'
import { getErrorMessage } from '../utils/errorHandler'
import { startTracking, stopTracking, isTracking, getLastPosition } from '../services/locationTracker'
import { useConfirm, CONFIRM_PRESETS } from '../hooks/useConfirm'

// UI Components
import { InteractiveMap } from '../components/InteractiveMap'
import { BottomSheet } from '../components/BottomSheet'

// ============================================================================
// HELPERS & SUBCOMPONENTS
// ============================================================================

/** Card de estatística clicável */
const StatCard = memo(function StatCard({
  label, value, icon, onClick,
}: { label: string; value: number; icon: typeof calendarOutline; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      background: '#252D3D', borderRadius: 16, padding: 16,
      cursor: 'pointer', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <IonIcon icon={icon} style={{ fontSize: 18, color: '#FF6B35' }} />
        <p style={{ margin: 0, fontSize: 13, color: '#8B9AB0', fontWeight: 600 }}>{label}</p>
      </div>
      <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'white' }}>{value}</p>
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
      background: '#252D3D', borderRadius: 16, marginBottom: 16,
      cursor: 'pointer', borderLeft: `4px solid ${statusColor}`,
      padding: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, textTransform: 'uppercase' }}>Próxima OS</span>
          <h3 style={{ margin: '4px 0', fontSize: 18, fontWeight: 800, color: 'white' }}>#{osNumber}</h3>
        </div>
        <div style={{ background: 'white', color: 'black', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IonIcon icon={chevronForwardOutline} style={{ fontSize: 20 }} />
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: '#8B9AB0', marginTop: 8 }}>
        {delivery.delivery_address_str || delivery.bairro || 'Endereço não informado'}
      </p>
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
  const [statusUpdating, setStatusUpdating] = useState(false)

  // Real-time location tracking for the map
  const [currentPosition, setCurrentPosition] = useState<{ latitude: number; longitude: number } | null>(null)

  const loadStats = useCallback(async () => {
    try {
      const [statsData, deliveriesData] = await Promise.all([
        getDriverStats(),
        getDriverDeliveries('active'),
      ])
      setStats(statsData)
      setActiveDeliveries(deliveriesData)
    } catch (e: unknown) {
      console.error(getErrorMessage(e))
    }
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  // Poll for stats every 30s
  useEffect(() => {
    const interval = setInterval(() => { loadStats() }, 30000)
    return () => clearInterval(interval)
  }, [loadStats])

  // GPS Tracking Loop
  useEffect(() => {
    if (!stats) return
    if (stats.status === 'available' || stats.status === 'busy') {
      if (!isTracking()) startTracking()
    } else {
      stopTracking()
    }

    // UI update loop for map icon position
    const posInterval = setInterval(() => {
      const pos = getLastPosition()
      if (pos) setCurrentPosition(pos)
    }, 2000)

    return () => {
      stopTracking()
      clearInterval(posInterval)
    }
  }, [stats?.status])

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
      console.error(getErrorMessage(e))
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

  const isAvailable = stats?.status === 'available' || stats?.status === 'busy';

  return (
    <IonPage>
      {/* 
        We use no IonHeader so the map can bleed to the top edges of the screen 
        (Uber style implies full screen immersion).
      */}
      <IonContent fullscreen style={{ '--background': '#1A1F2E' }}>

        {/* Underlay Map */}
        <InteractiveMap currentPosition={currentPosition} />

        {/* Floating Top UI (like Uber's Top bar over the map) */}
        <div style={{
          position: 'absolute', top: 40, left: 16, right: 16, zIndex: 1000,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
        }}>
          {/* Status Pill */}
          <button
            onClick={handleStatusToggle}
            disabled={statusUpdating}
            style={{
              background: isAvailable ? '#10B981' : '#1A1F2E',
              color: 'white', border: 'none', borderRadius: 20,
              padding: '10px 16px', fontWeight: 700, fontSize: 14,
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
          >
            {statusUpdating ? <IonSpinner name="dots" style={{ width: 16 }} /> : (
              <><div style={{ width: 8, height: 8, borderRadius: 4, background: 'white' }} />
                {isAvailable ? 'Você está Online' : 'Ficar Online'}</>
            )}
          </button>

          {/* Action Buttons Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={handleLogout}
              style={{
                width: 44, height: 44, borderRadius: 22, background: 'white',
                border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <IonIcon icon={logOutOutline} style={{ color: 'black', fontSize: 22 }} />
            </button>
            <button
              onClick={loadStats}
              style={{
                width: 44, height: 44, borderRadius: 22, background: 'white',
                border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <IonIcon icon={locationOutline} style={{ color: 'black', fontSize: 22 }} />
            </button>
          </div>
        </div>

        {/* Bottom Sheet UI */}
        <BottomSheet initialHeight={240} maxHeight="80vh">
          {stats && (
            <div>
              {/* Resumo */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, color: 'white', fontWeight: 800 }}>{user?.full_name}</h2>
                  {truckPlate && <span style={{ color: '#FF6B35', fontWeight: 700, fontSize: 13 }}>Placa: {truckPlate}</span>}
                </div>
              </div>

              {/* Active Next OS */}
              {activeDeliveries.length > 0 && (
                <NextOSCard
                  delivery={activeDeliveries[0]}
                  onClick={() => history.push(`/delivery/${activeDeliveries[0].id}`)}
                />
              )}

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <StatCard label="Hoje" value={stats.today_deliveries ?? 0} icon={timeOutline}
                  onClick={() => history.push('/deliveries/history?period=today')} />
                <StatCard label="Semana" value={stats.week_deliveries ?? 0} icon={calendarOutline}
                  onClick={() => history.push('/deliveries/history?period=week')} />
              </div>

              {/* Todos Pedidos btn */}
              <button
                onClick={() => history.push('/deliveries')}
                style={{
                  width: '100%', height: 50, borderRadius: 14,
                  background: '#1A1F2E', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white', fontWeight: 700, fontSize: 15,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                <IonIcon icon={menuOutline} style={{ fontSize: 20 }} />
                Ver lista completa de OSs
              </button>
            </div>
          )}
        </BottomSheet>
      </IonContent>
    </IonPage>
  )
}
