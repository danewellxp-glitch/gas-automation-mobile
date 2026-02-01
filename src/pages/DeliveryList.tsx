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
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonTitle,
  IonToolbar,
  RefresherEventDetail,
  useIonToast,
} from '@ionic/react'
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
 * Item de entrega na lista
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
  const statusColor = useMemo(() => {
    const colors: Partial<Record<DeliveryStatus, string>> = {
      pending: 'var(--ion-color-warning)',
      assigned: 'var(--ion-color-primary)',
      in_transit: 'var(--ion-color-tertiary)',
      delivered: 'var(--ion-color-success)',
      failed: 'var(--ion-color-danger)',
    }
    return colors[delivery.status] || 'var(--ion-color-medium)'
  }, [delivery.status])

  return (
    <IonItem button onClick={onClick} detail>
      <div
        slot="start"
        style={{
          width: 4,
          height: 40,
          borderRadius: 2,
          background: statusColor,
        }}
      />
      <IonLabel>
        <h2 style={{ fontWeight: 600, fontSize: 16 }}>
          Pedido #{delivery.order_number || String(delivery.order_id || delivery.id).slice(0, 8)}
        </h2>
        <p style={{ color: 'var(--ion-color-dark)', marginTop: 4 }}>
          {delivery.delivery_address_str || delivery.bairro || delivery.address || 'Endereco nao informado'}
        </p>
        <p style={{ color: statusColor, fontWeight: 500, marginTop: 2 }}>
          {getStatusLabel(delivery.status)}
        </p>
      </IonLabel>
      {showAccept && (
        <IonButton
          slot="end"
          fill="solid"
          color="primary"
          onClick={(e) => {
            e.stopPropagation()
            onAccept()
          }}
          disabled={accepting}
          size="small"
        >
          {accepting ? (
            <IonSpinner name="crescent" style={{ width: 16, height: 16 }} />
          ) : (
            'Aceitar'
          )}
        </IonButton>
      )}
    </IonItem>
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
          <IonList lines="full">
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
          </IonList>
        )}
      </IonContent>
    </IonPage>
  )
}
