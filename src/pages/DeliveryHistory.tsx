/**
 * Delivery History — Dark Theme
 * Histórico de OSs concluídas com filtro por período e busca.
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
  IonTitle,
  IonToolbar,
  RefresherEventDetail,
} from '@ionic/react'
import {
  calendarOutline,
  checkmarkCircleOutline,
  locationOutline,
  personOutline,
  searchOutline,
  timeOutline,
} from 'ionicons/icons'
import { useCallback, useEffect, useMemo, useState, memo } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { getDriverDeliveries, type Delivery } from '../services/api'
import { getErrorMessage, isNetworkError } from '../utils/errorHandler'
import { DeliveryListSkeleton } from '../components/Skeletons'
import { EmptyState, ErrorState, OfflineState } from '../components/EmptyState'
import { NetworkStatusBanner } from '../components/NetworkStatus'

// ============================================================================
// HELPERS
// ============================================================================

type Period = 'today' | 'week'

function formatDateTime(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateOnly(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR')
}

function isToday(iso?: string): boolean {
  if (!iso) return false
  const d = new Date(iso)
  return d.toDateString() === new Date().toDateString()
}

function isThisWeek(iso?: string): boolean {
  if (!iso) return false
  const d = new Date(iso)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return d >= weekAgo
}

function getDeliveryDate(d: Delivery): string | undefined {
  return d.delivered_at || d.updated_at || d.created_at
}

// ============================================================================
// COMPONENTS
// ============================================================================

const PeriodTabs = memo(function PeriodTabs({ current, onChange }: {
  current: Period; onChange: (p: Period) => void
}) {
  const tabs: { value: Period; label: string; icon: string }[] = [
    { value: 'today', label: 'Hoje', icon: timeOutline },
    { value: 'week', label: 'Esta semana', icon: calendarOutline },
  ]
  return (
    <div style={{ display: 'flex', gap: 8, padding: '8px 16px' }}>
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          style={{
            flex: 1, padding: '10px 4px', borderRadius: 12,
            fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
            background: current === t.value ? '#FF6B35' : '#1A1F2E',
            color: current === t.value ? 'white' : '#8B9AB0',
            boxShadow: current === t.value ? '0 4px 16px rgba(255,107,53,0.35)' : 'none',
            border: current !== t.value ? '1px solid rgba(255,255,255,0.07)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          } as React.CSSProperties}
        >
          <IonIcon icon={t.icon} style={{ fontSize: 14 }} />
          {t.label}
        </button>
      ))}
    </div>
  )
})

const OSHistoryCard = memo(function OSHistoryCard({ delivery, onClick }: {
  delivery: Delivery; onClick: () => void
}) {
  const dateLabel = formatDateTime(getDeliveryDate(delivery))
  const osNumber = delivery.order_number || String(delivery.order_id || delivery.id).slice(0, 8)
  const address = delivery.delivery_address_str || delivery.bairro || delivery.address || 'Endereço não informado'

  return (
    <div onClick={onClick} style={{
      margin: '0 16px 12px', borderRadius: 18,
      background: '#1A1F2E', border: '1px solid rgba(255,255,255,0.07)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.3)', overflow: 'hidden',
      cursor: 'pointer',
    }}>
      {/* Barra verde de entregue */}
      <div style={{ height: 3, background: '#10B981' }} />

      <div style={{ padding: '14px 16px 16px' }}>
        {/* Cabeçalho: OS + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 13, flexShrink: 0,
            background: '#10B98118', border: '1.5px solid #10B98144',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 22, color: '#10B981' }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'white' }}>OS #{osNumber}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span style={{
                padding: '2px 8px', background: '#10B98122', color: '#10B981',
                borderRadius: 6, fontSize: 11, fontWeight: 700, border: '1px solid #10B98133',
              }}>
                Entregue
              </span>
              {delivery.order_total != null && delivery.order_total > 0 && (
                <span style={{ fontSize: 14, fontWeight: 700, color: '#10B981' }}>
                  R$ {delivery.order_total.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 18, color: '#4B5A6E', flexShrink: 0 }} />
        </div>

        {/* Cliente */}
        {delivery.customer_name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <IonIcon icon={personOutline} style={{ fontSize: 13, color: '#4B5A6E' }} />
            <span style={{ fontSize: 14, color: '#c0cad4', fontWeight: 500 }}>{delivery.customer_name}</span>
          </div>
        )}

        {/* Endereço */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: dateLabel ? 8 : 0 }}>
          <IonIcon icon={locationOutline} style={{ fontSize: 13, color: '#4B5A6E', marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#8B9AB0', lineHeight: 1.4 }}>
            {address}{delivery.bairro && address !== delivery.bairro && ` — ${delivery.bairro}`}
          </span>
        </div>

        {/* Data e hora */}
        {dateLabel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <IonIcon icon={timeOutline} style={{ fontSize: 13, color: '#FF6B35' }} />
            <span style={{ fontSize: 12, color: '#FF6B35', fontWeight: 600 }}>{dateLabel}</span>
          </div>
        )}
      </div>
    </div>
  )
})

// ============================================================================
// PAGE
// ============================================================================

export default function DeliveryHistory() {
  const history = useHistory()
  const location = useLocation()

  const params = new URLSearchParams(location.search)
  const initialPeriod = (params.get('period') as Period) || 'today'

  const [period, setPeriod] = useState<Period>(initialPeriod)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  const load = useCallback(async () => {
    try {
      setError(null)
      setIsOffline(false)
      const data = await getDriverDeliveries('completed')
      setDeliveries(data)
    } catch (e: unknown) {
      if (isNetworkError(e)) setIsOffline(true)
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const onRefresh = async (e: CustomEvent<RefresherEventDetail>) => {
    await load(); e.detail.complete()
  }

  const filtered = useMemo(() => {
    let list = deliveries.filter((d) => {
      const date = getDeliveryDate(d)

      // If a specific date is chosen, period tabs are ignored
      if (dateFilter) {
        if (!date) return false
        const dDate = new Date(date).toISOString().split('T')[0]
        return dDate === dateFilter
      }

      return period === 'today' ? isToday(date) : isThisWeek(date)
    })

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (d) =>
          String(d.customer_name || '').toLowerCase().includes(q) ||
          String(d.order_number || '').toLowerCase().includes(q) ||
          String(d.order_id || '').toLowerCase().includes(q) ||
          String(d.id || '').toLowerCase().includes(q)
      )
    }

    return list.sort((a, b) => {
      const da = new Date(getDeliveryDate(a) || 0).getTime()
      const db = new Date(getDeliveryDate(b) || 0).getTime()
      return db - da
    })
  }, [deliveries, period, search])

  const grouped = useMemo(() => {
    const map = new Map<string, Delivery[]>()
    for (const d of filtered) {
      const key = formatDateOnly(getDeliveryDate(d)) || 'Sem data'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(d)
    }
    return Array.from(map.entries())
  }, [filtered])

  const periodLabel = period === 'today' ? 'Hoje' : 'Esta semana'

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/dashboard" text="" />
          </IonButtons>
          <IonTitle style={{ fontWeight: 800, color: 'white' }}>Histórico de OSs</IonTitle>
        </IonToolbar>

        <IonToolbar style={{ '--min-height': 'auto' } as React.CSSProperties}>
          <PeriodTabs current={period} onChange={setPeriod} />
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
        <IonToolbar style={{ '--min-height': 'auto', paddingBottom: 8 }}>
          <div style={{ display: 'flex', gap: 10, padding: '0 16px', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#8B9AB0', fontWeight: 600 }}>Filtrar por dia:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={e => {
                setDateFilter(e.target.value)
                if (e.target.value) setSearch('') // Clear search when picking date or keep it? Let's keep it.
              }}
              style={{
                flex: 1,
                height: 38,
                background: '#1A1F2E',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10,
                padding: '0 12px',
                fontSize: 14,
                color: 'white',
                outline: 'none',
              }}
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                style={{ background: 'transparent', color: '#FF6B35', border: 'none', fontSize: 13, fontWeight: 700 }}
              >
                Limpar
              </button>
            )}
          </div>
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
            icon={searchOutline}
            title={`Nenhuma OS — ${periodLabel}`}
            message={
              search
                ? 'Nenhum resultado para a busca.'
                : `Nenhuma OS concluída ${period === 'today' ? 'hoje' : 'nesta semana'}.`
            }
            action={{ label: 'Atualizar', onClick: load }}
          />
        )}

        {!loading && !error && grouped.length > 0 && (
          <div style={{ padding: '12px 0 40px' }}>
            <p style={{ margin: '0 16px 10px', fontSize: 12, color: '#4B5A6E', fontWeight: 600 }}>
              {filtered.length} OS{filtered.length !== 1 ? 's' : ''} — {periodLabel}
            </p>

            {grouped.map(([date, items]) => (
              <div key={date}>
                {/* Separador de data */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 16px 8px',
                }}>
                  <IonIcon icon={calendarOutline} style={{ fontSize: 13, color: '#4B5A6E' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#4B5A6E', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {date}
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                </div>

                {items.map((d) => (
                  <OSHistoryCard
                    key={d.id}
                    delivery={d}
                    onClick={() => history.push(`/delivery/${d.id}`)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </IonContent>
    </IonPage >
  )
}
