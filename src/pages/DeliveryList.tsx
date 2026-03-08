/**
 * Delivery List — Dark Theme
 * Lista de OSs com busca, filtros e datas.
 */

import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSpinner,
  IonTitle,
  IonToolbar,
  RefresherEventDetail,
  useIonToast,
} from '@ionic/react'
import {
  checkmarkCircleOutline,
  chevronForwardOutline,
  locationOutline,
  personOutline,
  searchOutline,
  timeOutline,
} from 'ionicons/icons'
import { useCallback, useEffect, useState, memo, useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import {
  getDriverDeliveries,
  acceptDelivery,
  getStatusLabel,
  type Delivery,
  type DeliveryStatus,
} from '../services/api'
import { getErrorMessage, isNetworkError } from '../utils/errorHandler'
import { useConfirm, CONFIRM_PRESETS } from '../hooks/useConfirm'
import { DeliveryListSkeleton } from '../components/Skeletons'
import { EmptyState, ErrorState, OfflineState, DELIVERY_EMPTY_STATES } from '../components/EmptyState'
import { NetworkStatusBanner } from '../components/NetworkStatus'

// ============================================================================
// HELPERS
// ============================================================================

type Filter = 'active' | 'pending' | 'completed'

function formatDateTime(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (minutes < 2) return 'Agora'
  if (minutes < 60) return `ha ${minutes}min`
  if (hours < 24 && d.toDateString() === now.toDateString())
    return `hoje ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString())
    return `ontem ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function getOSDate(d: Delivery, filter: Filter): string | undefined {
  if (filter === 'completed') return d.delivered_at || d.updated_at
  if (filter === 'active') return d.in_transit_at || d.picked_up_at || d.assigned_at
  return d.assigned_at || d.created_at
}

const STATUS_COLORS: Partial<Record<DeliveryStatus, string>> = {
  pending: '#FBBF24',
  assigned: '#60A5FA',
  picked_up: '#60A5FA',
  in_transit: '#A78BFA',
  arrived: '#34D399',
  delivered: '#10B981',
  failed: '#F87171',
}

// ============================================================================
// COMPONENTS
// ============================================================================

const FilterTabs = memo(function FilterTabs({ current, onChange, disabled }: {
  current: Filter; onChange: (f: Filter) => void; disabled: boolean
}) {
  const filters: { value: Filter; label: string }[] = [
    { value: 'active', label: 'Ativas' },
    { value: 'pending', label: 'Pendentes' },
    { value: 'completed', label: 'Concluidas' },
  ]
  return (
    <div style={{ display: 'flex', gap: 8, padding: '8px 16px' }}>
      {filters.map((f) => (
        <button key={f.value} disabled={disabled} onClick={() => onChange(f.value)} style={{
          flex: 1, padding: '10px 4px', borderRadius: 12, fontWeight: 700,
          fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
          background: current === f.value ? '#FF6B35' : '#1A1F2E',
          color: current === f.value ? 'white' : '#8B9AB0',
          boxShadow: current === f.value ? '0 4px 16px rgba(255,107,53,0.35)' : 'none',
          border: current !== f.value ? '1px solid rgba(255,255,255,0.07)' : 'none',
        } as React.CSSProperties}>
          {f.label}
        </button>
      ))}
    </div>
  )
})

const OSItem = memo(function OSItem({ delivery, filter, showAccept, accepting, onAccept, onClick }: {
  delivery: Delivery; filter: Filter; showAccept: boolean;
  accepting: boolean; onAccept: () => void; onClick: () => void
}) {
  const statusColor = STATUS_COLORS[delivery.status] || '#8B9AB0'
  const address = delivery.delivery_address_str || delivery.bairro || delivery.address || 'Endereço não informado'
  const osNumber = delivery.order_number || String(delivery.order_id || delivery.id).slice(0, 8)
  const dateLabel = formatDateTime(getOSDate(delivery, filter))

  return (
    <div onClick={!showAccept ? onClick : undefined} style={{
      margin: '0 16px 12px', borderRadius: 18,
      background: '#1A1F2E', border: '1px solid rgba(255,255,255,0.07)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.3)', overflow: 'hidden',
      cursor: showAccept ? 'default' : 'pointer',
    }}>
      {/* Barra de status no topo */}
      <div style={{ height: 3, background: statusColor }} />

      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 13, flexShrink: 0,
            background: `${statusColor}1A`, border: `1.5px solid ${statusColor}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IonIcon
              icon={filter === 'completed' ? checkmarkCircleOutline : locationOutline}
              style={{ fontSize: 22, color: statusColor }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'white' }}>OS #{osNumber}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span style={{
                padding: '2px 8px', background: `${statusColor}22`, color: statusColor,
                borderRadius: 6, fontSize: 11, fontWeight: 700, border: `1px solid ${statusColor}33`,
              }}>
                {getStatusLabel(delivery.status)}
              </span>
              {delivery.order_total != null && delivery.order_total > 0 && (
                <span style={{ fontSize: 14, fontWeight: 700, color: '#10B981' }}>
                  R$ {delivery.order_total.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {!showAccept && (
            <IonIcon icon={chevronForwardOutline} style={{ fontSize: 18, color: '#4B5A6E', flexShrink: 0 }} />
          )}
        </div>

        {delivery.customer_name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <IonIcon icon={personOutline} style={{ fontSize: 13, color: '#4B5A6E' }} />
            <span style={{ fontSize: 14, color: '#c0cad4', fontWeight: 500 }}>{delivery.customer_name}</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: dateLabel ? 8 : 0 }}>
          <IonIcon icon={locationOutline} style={{ fontSize: 13, color: '#4B5A6E', marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#8B9AB0', lineHeight: 1.4 }}>
            {address}{delivery.bairro && address !== delivery.bairro && ` — ${delivery.bairro}`}
          </span>
        </div>

        {dateLabel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <IonIcon icon={timeOutline} style={{ fontSize: 13, color: '#FF6B35' }} />
            <span style={{ fontSize: 12, color: '#FF6B35', fontWeight: 600 }}>{dateLabel}</span>
          </div>
        )}

        {showAccept && (
          <button
            disabled={accepting}
            onClick={(e) => { e.stopPropagation(); onAccept() }}
            style={{
              marginTop: 12, width: '100%', height: 46, borderRadius: 12, border: 'none',
              background: accepting ? '#252D3D' : 'linear-gradient(135deg, #FF6B35, #E55A26)',
              color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {accepting
              ? <IonSpinner name="crescent" style={{ width: 20, height: 20 }} />
              : 'Aceitar OS'}
          </button>
        )}
      </div>
    </div>
  )
})

// ============================================================================
// PAGE
// ============================================================================

export default function DeliveryList() {
  const history = useHistory()
  const { confirm } = useConfirm()
  const [presentToast] = useIonToast()

  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [filter, setFilter] = useState<Filter>('active')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      setIsOffline(false)
      const data = await getDriverDeliveries(filter)
      setDeliveries(data)
    } catch (e: unknown) {
      if (isNetworkError(e)) setIsOffline(true)
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { setLoading(true); setSearch(''); load() }, [load])

  useEffect(() => {
    if (filter !== 'pending') return
    const interval = setInterval(() => { load() }, 30000)
    return () => clearInterval(interval)
  }, [filter, load])

  const onRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await load(); event.detail.complete()
  }

  const handleFilterChange = (newFilter: Filter) => {
    if (newFilter !== filter && !loading) setFilter(newFilter)
  }

  const handleAccept = async (id: string) => {
    const { confirmed } = await confirm(CONFIRM_PRESETS.acceptDelivery)
    if (!confirmed) return
    setAcceptingId(id)
    try {
      await acceptDelivery(id)
      await presentToast({ message: 'OS aceita!', duration: 2000, color: 'success', position: 'top' })
      await load()
    } catch (e: unknown) {
      await presentToast({ message: getErrorMessage(e), duration: 3000, color: 'danger', position: 'top' })
    } finally {
      setAcceptingId(null)
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return deliveries
    const q = search.trim().toLowerCase()
    return deliveries.filter((d) =>
      String(d.customer_name || '').toLowerCase().includes(q) ||
      String(d.order_number || '').toLowerCase().includes(q) ||
      String(d.order_id || '').toLowerCase().includes(q) ||
      String(d.id || '').toLowerCase().includes(q)
    )
  }, [deliveries, search])

  const emptyStateConfig = DELIVERY_EMPTY_STATES[filter]

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/dashboard" text="" />
          </IonButtons>
          <IonTitle style={{ fontWeight: 800, color: 'white' }}>Ordens de Serviço</IonTitle>
        </IonToolbar>

        <IonToolbar style={{ '--min-height': 'auto' } as React.CSSProperties}>
          <FilterTabs current={filter} onChange={handleFilterChange} disabled={loading} />
        </IonToolbar>

        <IonToolbar style={{ '--min-height': 'auto' } as React.CSSProperties}>
          <IonSearchbar
            value={search}
            onIonInput={(e) => setSearch(String(e.detail.value || ''))}
            placeholder="Buscar por cliente ou OS..."
            debounce={200}
            style={{ paddingTop: 0 }}
          />
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <NetworkStatusBanner onRetry={load} />
        <IonRefresher slot="fixed" onIonRefresh={onRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {loading && <DeliveryListSkeleton />}
        {!loading && isOffline && <OfflineState onRetry={load} />}
        {!loading && !isOffline && error && <ErrorState message={error} onRetry={load} />}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            icon={search ? searchOutline : emptyStateConfig.icon}
            title={search ? 'Nenhum resultado' : emptyStateConfig.title}
            message={search ? 'Tente outro nome ou número de OS.' : emptyStateConfig.message}
            action={{ label: 'Atualizar', onClick: load }}
          />
        )}

        {!loading && !error && filtered.length > 0 && (
          <div style={{ padding: '12px 0 40px' }}>
            <p style={{ margin: '0 16px 10px', fontSize: 12, color: '#4B5A6E', fontWeight: 600 }}>
              {filtered.length} OS{filtered.length !== 1 ? 's' : ''}
            </p>
            {filtered.map((d) => (
              <OSItem
                key={d.id}
                delivery={d}
                filter={filter}
                showAccept={filter === 'pending' && d.status === 'pending'}
                accepting={acceptingId === d.id}
                onAccept={() => handleAccept(d.id)}
                onClick={() => history.push(`/delivery/${d.id}`)}
              />
            ))}
          </div>
        )}
      </IonContent>
    </IonPage>
  )
}
