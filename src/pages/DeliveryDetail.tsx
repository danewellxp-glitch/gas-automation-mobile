/**
 * Delivery Detail Page
 *
 * Detalhes de uma entrega específica.
 * Permite atualizar status com confirmação.
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
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonToast,
} from '@ionic/react'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  getDeliveryById,
  updateDeliveryStatus,
  getStatusLabel,
  canUpdateStatus,
  type Delivery,
  type DeliveryStatus,
} from '../services/api'
import { getErrorMessage, isNetworkError } from '../utils/errorHandler'
import { useConfirm, CONFIRM_PRESETS } from '../hooks/useConfirm'
import { DeliveryDetailSkeleton } from '../components/Skeletons'
import { ErrorState, OfflineState, EmptyState } from '../components/EmptyState'
import { NetworkStatusBanner } from '../components/NetworkStatus'
import { alertCircleOutline } from 'ionicons/icons'

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Opções de status disponíveis
 */
const STATUS_OPTIONS: { value: DeliveryStatus; label: string; color: string }[] = [
  { value: 'picked_up', label: 'Retirada', color: 'primary' },
  { value: 'in_transit', label: 'Em rota', color: 'tertiary' },
  { value: 'arrived', label: 'Chegou', color: 'secondary' },
  { value: 'delivered', label: 'Entregue', color: 'success' },
  { value: 'failed', label: 'Falha', color: 'danger' },
]

// ============================================================================
// PAGE
// ============================================================================

export default function DeliveryDetail() {
  const { id } = useParams<{ id: string }>()
  const { confirm } = useConfirm()
  const [presentToast] = useIonToast()

  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [updating, setUpdating] = useState<DeliveryStatus | null>(null)

  /**
   * Carrega entrega
   */
  const load = useCallback(async () => {
    if (!id) return

    try {
      setError(null)
      setIsOffline(false)
      const data = await getDeliveryById(id)
      setDelivery(data)
    } catch (e: unknown) {
      if (isNetworkError(e)) {
        setIsOffline(true)
      }
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  /**
   * Atualiza status com confirmação
   */
  const handleStatusChange = async (status: DeliveryStatus) => {
    if (!id) return

    // Usa preset apropriado ou genérico
    const preset =
      status === 'delivered'
        ? CONFIRM_PRESETS.completeDelivery
        : status === 'failed'
          ? CONFIRM_PRESETS.failDelivery
          : CONFIRM_PRESETS.changeStatus(getStatusLabel(status))

    const { confirmed } = await confirm(preset)
    if (!confirmed) return

    setUpdating(status)
    try {
      await updateDeliveryStatus(id, status)
      await presentToast({
        message: `Status atualizado para: ${getStatusLabel(status)}`,
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
      setUpdating(null)
    }
  }

  /**
   * Verifica se pode atualizar status
   */
  const showStatusButtons = useMemo(() => {
    return delivery && canUpdateStatus(delivery.status)
  }, [delivery])

  /**
   * Cor do status atual
   */
  const statusColor = useMemo(() => {
    if (!delivery) return 'medium'
    const colors: Partial<Record<DeliveryStatus, string>> = {
      pending: 'warning',
      assigned: 'primary',
      picked_up: 'primary',
      in_transit: 'tertiary',
      arrived: 'secondary',
      delivered: 'success',
      failed: 'danger',
      returned: 'medium',
    }
    return colors[delivery.status] || 'medium'
  }, [delivery])

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/deliveries" text="" />
          </IonButtons>
          <IonTitle>Entrega</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <NetworkStatusBanner onRetry={load} />

        {/* Loading State */}
        {loading && <DeliveryDetailSkeleton />}

        {/* Offline State */}
        {!loading && isOffline && <OfflineState onRetry={load} />}

        {/* Error State */}
        {!loading && !isOffline && error && (
          <ErrorState message={error} onRetry={load} />
        )}

        {/* Not Found State */}
        {!loading && !error && !delivery && (
          <EmptyState
            icon={alertCircleOutline}
            title="Entrega nao encontrada"
            message="Esta entrega pode ter sido removida ou voce nao tem acesso."
            action={{ label: 'Voltar', onClick: () => window.history.back() }}
          />
        )}

        {/* Success State */}
        {!loading && !error && delivery && (
          <div className="ion-padding">
            {/* Status Badge */}
            <div
              style={{
                display: 'inline-block',
                background: `var(--ion-color-${statusColor})`,
                color: `var(--ion-color-${statusColor}-contrast)`,
                padding: '6px 12px',
                borderRadius: 16,
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              {getStatusLabel(delivery.status)}
            </div>

            {/* Detalhes */}
            <IonList lines="full" style={{ marginBottom: 24 }}>
              <IonItem>
                <IonLabel>
                  <p style={{ color: 'var(--ion-color-medium)', fontSize: 12 }}>Pedido</p>
                  <h2 style={{ fontWeight: 600, fontSize: 18, marginTop: 4 }}>
                    #{String(delivery.order_id || delivery.id).slice(0, 8)}
                  </h2>
                </IonLabel>
              </IonItem>

              <IonItem>
                <IonLabel>
                  <p style={{ color: 'var(--ion-color-medium)', fontSize: 12 }}>Endereco / Bairro</p>
                  <h2 style={{ fontSize: 16, marginTop: 4 }}>
                    {delivery.address || delivery.bairro || 'Nao informado'}
                  </h2>
                </IonLabel>
              </IonItem>

              {delivery.customer_name && (
                <IonItem>
                  <IonLabel>
                    <p style={{ color: 'var(--ion-color-medium)', fontSize: 12 }}>Cliente</p>
                    <h2 style={{ fontSize: 16, marginTop: 4 }}>{delivery.customer_name}</h2>
                  </IonLabel>
                </IonItem>
              )}

              {delivery.customer_phone && (
                <IonItem>
                  <IonLabel>
                    <p style={{ color: 'var(--ion-color-medium)', fontSize: 12 }}>Telefone</p>
                    <h2 style={{ fontSize: 16, marginTop: 4 }}>
                      <a href={`tel:${delivery.customer_phone}`} style={{ color: 'var(--ion-color-primary)' }}>
                        {delivery.customer_phone}
                      </a>
                    </h2>
                  </IonLabel>
                </IonItem>
              )}

              {delivery.notes && (
                <IonItem>
                  <IonLabel className="ion-text-wrap">
                    <p style={{ color: 'var(--ion-color-medium)', fontSize: 12 }}>Observacoes</p>
                    <h2 style={{ fontSize: 14, marginTop: 4, lineHeight: 1.5 }}>
                      {delivery.notes}
                    </h2>
                  </IonLabel>
                </IonItem>
              )}
            </IonList>

            {/* Botões de Status */}
            {showStatusButtons && (
              <div>
                <p
                  style={{
                    marginBottom: 12,
                    fontWeight: 600,
                    fontSize: 16,
                    color: 'var(--ion-color-dark)',
                  }}
                >
                  Atualizar status
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {STATUS_OPTIONS.map((opt) => {
                    const isCurrentStatus = delivery.status === opt.value
                    const isUpdating = updating === opt.value

                    return (
                      <IonButton
                        key={opt.value}
                        fill={isCurrentStatus ? 'solid' : 'outline'}
                        color={opt.color}
                        size="small"
                        disabled={isCurrentStatus || updating !== null}
                        onClick={() => handleStatusChange(opt.value)}
                        style={{ minWidth: 90 }}
                      >
                        {isUpdating ? (
                          <IonSpinner name="crescent" style={{ width: 16, height: 16 }} />
                        ) : (
                          opt.label
                        )}
                      </IonButton>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Mensagem para entregas finalizadas */}
            {!showStatusButtons && delivery.status === 'delivered' && (
              <div
                style={{
                  background: 'var(--ion-color-success-shade)',
                  padding: 16,
                  borderRadius: 8,
                  textAlign: 'center',
                }}
              >
                <p style={{ margin: 0, color: 'var(--ion-color-success-contrast)' }}>
                  Entrega concluida com sucesso!
                </p>
              </div>
            )}

            {!showStatusButtons && delivery.status === 'failed' && (
              <div
                style={{
                  background: 'var(--ion-color-danger-shade)',
                  padding: 16,
                  borderRadius: 8,
                  textAlign: 'center',
                }}
              >
                <p style={{ margin: 0, color: 'var(--ion-color-danger-contrast)' }}>
                  Esta entrega foi marcada como falha.
                </p>
              </div>
            )}
          </div>
        )}
      </IonContent>
    </IonPage>
  )
}
