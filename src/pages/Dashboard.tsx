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
import { useCallback, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDriverStats, updateDriverStatus, type DriverStats } from '../services/api'

export default function Dashboard() {
  const history = useHistory()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    history.replace('/login')
  }
  const [stats, setStats] = useState<DriverStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const loadStats = useCallback(async () => {
    try {
      setError(null)
      const data = await getDriverStats()
      setStats(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar estatísticas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const onRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadStats()
    event.detail.complete()
  }

  const handleStatusToggle = async () => {
    if (!stats) return
    const nextStatus = stats.status === 'available' ? 'offline' : 'available'
    setStatusUpdating(true)
    try {
      await updateDriverStatus(nextStatus)
      await loadStats()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar status')
    } finally {
      setStatusUpdating(false)
    }
  }

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
        <IonRefresher slot="fixed" onIonRefresh={onRefresh}>
          <IonRefresherContent />
        </IonRefresher>
        <div className="ion-padding">
          {user && (
            <p style={{ marginBottom: 16, color: 'var(--ion-color-medium)' }}>
              Olá, {user.full_name || user.email}
            </p>
          )}
          {loading && (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <IonSpinner name="crescent" />
            </div>
          )}
          {error && (
            <p style={{ color: 'var(--ion-color-danger)', marginBottom: 16 }}>{error}</p>
          )}
          {!loading && stats && (
            <>
              <div
                style={{
                  background: 'var(--ion-color-primary)',
                  color: 'white',
                  padding: 20,
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              >
                <p style={{ margin: 0, opacity: 0.9 }}>Status</p>
                <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 600 }}>
                  {stats.status === 'available' ? 'Disponível' : stats.status}
                </p>
                <IonButton
                  fill="outline"
                  color="light"
                  size="small"
                  style={{ marginTop: 12 }}
                  disabled={statusUpdating}
                  onClick={handleStatusToggle}
                >
                  {statusUpdating ? <IonSpinner name="crescent" /> : 'Alternar status'}
                </IonButton>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: 'var(--ion-color-light)', padding: 16, borderRadius: 12 }}>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--ion-color-medium)' }}>
                    Hoje
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 600 }}>
                    {stats.today_deliveries ?? 0}
                  </p>
                  <p style={{ margin: 0, fontSize: 12 }}>entregas</p>
                </div>
                <div style={{ background: 'var(--ion-color-light)', padding: 16, borderRadius: 12 }}>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--ion-color-medium)' }}>
                    Semana
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 600 }}>
                    {stats.week_deliveries ?? 0}
                  </p>
                  <p style={{ margin: 0, fontSize: 12 }}>entregas</p>
                </div>
              </div>
              <IonButton
                expand="block"
                routerLink="/deliveries"
                style={{ marginTop: 24 }}
              >
                Ver entregas
              </IonButton>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  )
}
