/**
 * Delivery List Page
 *
 * Lista de entregas com filtros (ativas, pendentes, concluídas).
 * Permite aceitar entregas pendentes com confirmação.
 */

import {
  IonBackButton,
  IonButton,
  IonButtons,
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
  useIonToast,
} from '@ionic/react'
import { locationOutline } from 'ionicons/icons'
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
// TYPES
// ============================================================================

type Filter = 'active' | 'pending' | 'completed'

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Botões de filtro
 */
const FilterButtons = memo(function FilterButtons({
  current,
  onChange,
  disabled,
}: {
  current: Filter
  onChange: (filter: Filter) => void
  disabled: boolean
}) {
  const filters: { value: Filter; label: string }[] = [
    { value: 'active', label: 'Ativas' },
    { value: 'pending', label: 'Pendentes' },
    { value: 'completed', label: 'Concluidas' },
  ]

  return (
    <IonButtons className="ion-padding-horizontal">
      {filters.map((f) => (
        <IonButton
          key={f.value}
          fill={current === f.value ? 'solid' : 'outline'}
          onClick={() => onChange(f.value)}
          disabled={disabled}
          size="small"
        >
          {f.label}
        </IonButton>
      ))}
    </IonButtons>
  )
})

/**
 * Mapa de cores por status (consistente com o design)
 */
const STATUS_COLORS: Partial<Record<DeliveryStatus, string>> = {
  pending: 'var(--status-pending)',
  assigned: 'var(--status-assigned)',
  picked_up: 'var(--status-assigned)',
  in_transit: 'var(--status-in-transit)',
  arrived: 'var(--status-arrived)',
  delivered: 'var(--status-delivered)',
  failed: 'var(--status-failed)',
}

/**
 * Card de entrega (design melhorado)
 */
const DeliveryItem = memo(function DeliveryItem({
  delivery,
  showAccept,
  accepting,
  onAccept,
  onClick,
}: {
  delivery: Delivery
  showAccept: boolean
  accepting: boolean
  onAccept: () => void
  onClick: () => void
}) {
  const statusColor = useMemo(
    () => STATUS_COLORS[delivery.status] || 'var(--ion-color-medium)',
    [delivery.status]
  )

  const address = delivery.delivery_address_str || delivery.bairro || delivery.address || 'Endereço não informado'
  const orderLabel = `#${delivery.order_number || String(delivery.order_id || delivery.id).slice(0, 8)}`

  return (
    <IonCard
      button
      onClick={onClick}
      className={accepting ? 'delivery-card-accepting' : ''}
      style={{
        margin: '0 16px 12px',
        borderRadius: 14,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        borderLeft: `4px solid ${statusColor}`,
      }}
    >
      <IonCardContent style={{ padding: 18 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <IonIcon icon={locationOutline} style={{ fontSize: 18, color: 'var(--ion-color-primary)', flexShrink: 0 }} />
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                Pedido {orderLabel}
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: 15, color: 'var(--ion-color-dark)', lineHeight: 1.4 }}>
              {address}
            </p>
            {delivery.bairro && address !== delivery.bairro && (
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--ion-color-medium)' }}>
                {delivery.bairro}
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
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
          </div>
          {showAccept && (
            <IonButton
              fill="solid"
              color="primary"
              onClick={(e) => {
                e.stopPropagation()
                onAccept()
              }}
              disabled={accepting}
              style={{
                '--border-radius': '10px',
                minWidth: 100,
                height: 44,
                fontWeight: 600,
                flexShrink: 0,
              } as React.CSSProperties}
            >
              {accepting ? (
                <IonSpinner name="crescent" style={{ width: 20, height: 20 }} />
              ) : (
                'Aceitar'
              )}
            </IonButton>
          )}
        </div>
      </IonCardContent>
    </IonCard>
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)

  /**
   * Carrega entregas
   */
  const load = useCallback(async () => {
    try {
      setError(null)
      setIsOffline(false)
      const data = await getDriverDeliveries(filter)
      setDeliveries(data)
    } catch (e: unknown) {
      if (isNetworkError(e)) {
        setIsOffline(true)
      }
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  /**
   * Pull-to-refresh
   */
  const onRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await load()
    event.detail.complete()
  }

  /**
   * Troca de filtro
   */
  const handleFilterChange = (newFilter: Filter) => {
    if (newFilter !== filter && !loading) {
      setFilter(newFilter)
    }
  }

  /**
   * Aceita entrega com confirmação
   */
  const handleAccept = async (id: string) => {
    const { confirmed } = await confirm(CONFIRM_PRESETS.acceptDelivery)
    if (!confirmed) return

    setAcceptingId(id)
    try {
      await acceptDelivery(id)
      await presentToast({
        message: 'Entrega aceita com sucesso!',
        duration: 2000,
        color: 'success',
        position: 'top',
      })
      await load()
    } catch (e: unknown) {
      await presentToast({
        message: getErrorMessage(e),
        duration: 3000,
        color: 'danger',
        position: 'top',
      })
    } finally {
      setAcceptingId(null)
    }
  }

  /**
   * Navega para detalhes
   */
  const handleItemClick = (id: string) => {
    history.push(`/delivery/${id}`)
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  const emptyStateConfig = DELIVERY_EMPTY_STATES[filter]

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/dashboard" text="" />
          </IonButtons>
          <IonTitle>Entregas</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <FilterButtons
            current={filter}
            onChange={handleFilterChange}
            disabled={loading}
          />
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <NetworkStatusBanner onRetry={load} />

        <IonRefresher slot="fixed" onIonRefresh={onRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Loading State */}
        {loading && <DeliveryListSkeleton />}

        {/* Offline State */}
        {!loading && isOffline && <OfflineState onRetry={load} />}

        {/* Error State */}
        {!loading && !isOffline && error && (
          <ErrorState message={error} onRetry={load} />
        )}

        {/* Empty State */}
        {!loading && !error && deliveries.length === 0 && (
          <EmptyState
            icon={emptyStateConfig.icon}
            title={emptyStateConfig.title}
            message={emptyStateConfig.message}
            action={{ label: 'Atualizar', onClick: load }}
          />
        )}

        {/* Success State */}
        {!loading && !error && deliveries.length > 0 && (
          <div style={{ padding: '8px 0 24px' }}>
              {deliveries.map((d) => (
                <DeliveryItem
                  key={d.id}
                  delivery={d}
                  showAccept={filter === 'pending' && d.status === 'pending'}
                  accepting={acceptingId === d.id}
                  onAccept={() => handleAccept(d.id)}
                  onClick={() => handleItemClick(d.id)}
                />
              ))}
          </div>
        )}
      </IonContent>
    </IonPage>
  )
}
