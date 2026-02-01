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
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
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
import { openNavigation } from '../utils/navigation'
import { useConfirm, CONFIRM_PRESETS } from '../hooks/useConfirm'
import { DeliveryDetailSkeleton } from '../components/Skeletons'
import { ErrorState, OfflineState, EmptyState } from '../components/EmptyState'
import { NetworkStatusBanner } from '../components/NetworkStatus'
import {
  alertCircleOutline,
  cameraOutline,
  callOutline,
  checkmarkCircleOutline,
  locateOutline,
  navigateOutline,
} from 'ionicons/icons'
import { takeDeliveryPhoto, uploadDeliveryProof } from '../services/camera'

// ============================================================================
// CONSTANTS
// ============================================================================

/** Etapas da entrega para timeline */
const DELIVERY_STAGES: { status: DeliveryStatus; label: string }[] = [
  { status: 'assigned', label: 'Atribuída' },
  { status: 'picked_up', label: 'Retirada' },
  { status: 'in_transit', label: 'Em rota' },
  { status: 'arrived', label: 'Chegou' },
  { status: 'delivered', label: 'Entregue' },
]

/**
 * Opções de status disponíveis (cores por status)
 */
const STATUS_OPTIONS: { value: DeliveryStatus; label: string; colorVar: string }[] = [
  { value: 'picked_up', label: 'Retirada', colorVar: 'var(--status-assigned)' },
  { value: 'in_transit', label: 'Em rota', colorVar: 'var(--status-in-transit)' },
  { value: 'arrived', label: 'Chegou', colorVar: 'var(--status-arrived)' },
  { value: 'delivered', label: 'Entregue', colorVar: 'var(--status-delivered)' },
  { value: 'failed', label: 'Falha', colorVar: 'var(--status-failed)' },
]

/**
 * Timeline visual do status (bolinha → linha → bolinha)
 */
function StatusTimeline({ delivery }: { delivery: Delivery }) {
  const statusOrder: DeliveryStatus[] = ['assigned', 'picked_up', 'in_transit', 'arrived', 'delivered']
  const currentIdx = statusOrder.indexOf(delivery.status)
  const isFailed = delivery.status === 'failed'

  return (
    <IonCard style={{ margin: '0 0 20px', borderRadius: 14 }}>
      <IonCardContent style={{ padding: 20 }}>
        <p style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: 'var(--ion-color-medium)' }}>
          Andamento
        </p>
        {DELIVERY_STAGES.map((stage, i) => {
          const stepIdx = statusOrder.indexOf(stage.status)
          const isCompleted = isFailed
            ? stage.status !== 'delivered' && stepIdx < currentIdx
            : stepIdx <= currentIdx
          const isCurrent = delivery.status === stage.status && !isFailed
          const isLast = i === DELIVERY_STAGES.length - 1

          return (
            <div key={stage.status} style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20 }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: isCompleted || isCurrent ? 'var(--ion-color-primary)' : 'var(--ion-color-light)',
                    border: `2px solid ${isCompleted || isCurrent ? 'var(--ion-color-primary)' : 'var(--ion-color-light-shade)'}`,
                    flexShrink: 0,
                  }}
                />
                {!isLast && (
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      minHeight: 28,
                      background: isCompleted ? 'var(--ion-color-primary)' : 'var(--ion-color-light-shade)',
                      marginTop: 4,
                    }}
                  />
                )}
              </div>
              <div style={{ marginLeft: 14, paddingBottom: isLast ? 0 : 8 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCompleted || isCurrent ? 'var(--ion-color-dark)' : 'var(--ion-color-medium)',
                  }}
                >
                  {stage.label}
                </p>
              </div>
            </div>
          )
        })}
      </IonCardContent>
    </IonCard>
  )
}

/**
 * Mapa estático ou placeholder com botão de navegação
 */
function MapSection({ address }: { address: string }) {
  if (!address) return null

  return (
    <IonCard style={{ margin: '0 0 20px', borderRadius: 14 }}>
      <IonCardContent style={{ padding: 0 }}>
        <div
          className="map-placeholder"
          style={{
            height: 140,
            background: 'linear-gradient(135deg, var(--ion-color-light) 0%, var(--ion-color-light-shade) 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <IonIcon icon={locateOutline} style={{ fontSize: 40, color: 'var(--ion-color-primary)' }} />
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ion-color-medium)', textAlign: 'center', padding: '0 16px' }}>
            {address}
          </p>
          <IonButton
            fill="solid"
            color="primary"
            onClick={() => openNavigation(address)}
            style={{ '--border-radius': '10px', fontWeight: 600 } as React.CSSProperties}
          >
            <IonIcon icon={navigateOutline} slot="start" />
            Abrir no mapa
          </IonButton>
        </div>
      </IonCardContent>
    </IonCard>
  )
}

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

  const onRefresh = async (e: CustomEvent<RefresherEventDetail>) => {
    await load()
    e.detail.complete()
  }

  /**
   * Atualiza status com confirmação
   * Para "delivered", exige foto de comprovante antes
   */
  const handleStatusChange = async (status: DeliveryStatus) => {
    if (!id) return

    // Para "entregue", exige foto primeiro
    if (status === 'delivered') {
      const { confirmed } = await confirm({
        header: 'Foto de comprovante',
        message: 'Tire uma foto como prova de entrega antes de confirmar.',
        confirmText: 'Tirar foto',
        cancelText: 'Cancelar',
      })
      if (!confirmed) return

      const photo = await takeDeliveryPhoto()
      if (!photo) {
        await presentToast({
          message: 'Foto obrigatoria para confirmar entrega.',
          duration: 3000,
          color: 'warning',
          position: 'top',
        })
        return
      }

      setUpdating(status)
      try {
        // Upload da foto
        await uploadDeliveryProof(id, photo)
        // Atualiza status
        await updateDeliveryStatus(id, status)
        await presentToast({
          message: 'Entrega confirmada com comprovante!',
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
      return
    }

    // Demais status: fluxo normal com confirmação
    const preset =
      status === 'failed'
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
   * Cor do status atual (variável CSS)
   */
  const statusColorVar = useMemo(() => {
    if (!delivery) return 'var(--ion-color-medium)'
    const vars: Partial<Record<DeliveryStatus, string>> = {
      pending: 'var(--status-pending)',
      assigned: 'var(--status-assigned)',
      picked_up: 'var(--status-assigned)',
      in_transit: 'var(--status-in-transit)',
      arrived: 'var(--status-arrived)',
      delivered: 'var(--status-delivered)',
      failed: 'var(--status-failed)',
      returned: 'var(--ion-color-medium)',
    }
    return vars[delivery.status] || 'var(--ion-color-medium)'
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

        <IonRefresher slot="fixed" onIonRefresh={onRefresh}>
          <IonRefresherContent />
        </IonRefresher>

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
                background: statusColorVar,
                color: 'white',
                padding: '8px 14px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 20,
              }}
            >
              {getStatusLabel(delivery.status)}
            </div>

            {/* Botão Ligar - Destaque */}
            {delivery.customer_phone && (
              <IonButton
                expand="block"
                fill="solid"
                color="primary"
                href={`tel:${delivery.customer_phone}`}
                style={{
                  marginBottom: 20,
                  '--border-radius': '12px',
                  height: 52,
                  fontWeight: 600,
                  fontSize: 17,
                } as React.CSSProperties}
              >
                <IonIcon icon={callOutline} slot="start" style={{ fontSize: 22 }} />
                Ligar para cliente
              </IonButton>
            )}

            {/* Timeline de Status */}
            <StatusTimeline delivery={delivery} />

            {/* Mapa com endereço */}
            <MapSection
              address={delivery.delivery_address_str || delivery.address || delivery.bairro || ''}
            />

            {/* Detalhes em card */}
            <IonCard style={{ margin: '0 0 20px', borderRadius: 14 }}>
              <IonCardContent style={{ padding: 20 }}>
                <IonList lines="none" style={{ background: 'transparent' }}>
                  <IonItem style={{ '--background': 'transparent', '--padding-start': 0, '--inner-padding-end': 0 } as React.CSSProperties}>
                    <IonLabel>
                      <p style={{ color: 'var(--ion-color-medium)', fontSize: 12 }}>Pedido</p>
                      <h2 style={{ fontWeight: 700, fontSize: 18, marginTop: 4 }}>
                        #{delivery.order_number || String(delivery.order_id || delivery.id).slice(0, 8)}
                      </h2>
                    </IonLabel>
                  </IonItem>

                  <IonItem style={{ '--background': 'transparent', '--padding-start': 0, '--inner-padding-end': 0 } as React.CSSProperties}>
                    <IonLabel>
                      <p style={{ color: 'var(--ion-color-medium)', fontSize: 12 }}>Endereço</p>
                      <h2 style={{ fontSize: 16, marginTop: 4, lineHeight: 1.4 }}>
                        {delivery.delivery_address_str || delivery.address || delivery.bairro || 'Não informado'}
                      </h2>
                      {delivery.bairro && (delivery.delivery_address_str || delivery.address) && (
                        <p style={{ margin: '2px 0 0', fontSize: 14, color: 'var(--ion-color-medium)' }}>{delivery.bairro}</p>
                      )}
                    </IonLabel>
                    {(delivery.delivery_address_str || delivery.address || delivery.bairro) && (
                      <IonButton
                        slot="end"
                        fill="outline"
                        color="primary"
                        size="default"
                        onClick={() => openNavigation(delivery.delivery_address_str || delivery.address || delivery.bairro || '')}
                        style={{ '--border-radius': '10px' } as React.CSSProperties}
                      >
                        <IonIcon icon={navigateOutline} slot="start" />
                        Navegar
                      </IonButton>
                    )}
                  </IonItem>

                  {delivery.customer_name && (
                    <IonItem style={{ '--background': 'transparent', '--padding-start': 0, '--inner-padding-end': 0 } as React.CSSProperties}>
                      <IonLabel>
                        <p style={{ color: 'var(--ion-color-medium)', fontSize: 12 }}>Cliente</p>
                        <h2 style={{ fontSize: 16, marginTop: 4 }}>{delivery.customer_name}</h2>
                      </IonLabel>
                    </IonItem>
                  )}

                  {delivery.order_items && delivery.order_items.length > 0 && (
                    <IonItem style={{ '--background': 'transparent', '--padding-start': 0, '--inner-padding-end': 0 } as React.CSSProperties}>
                      <IonLabel>
                        <p style={{ color: 'var(--ion-color-medium)', fontSize: 12, marginBottom: 8 }}>Itens do pedido</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {delivery.order_items.map((item, i) => (
                            <div
                              key={i}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '8px 12px',
                                background: 'var(--ion-color-light)',
                                borderRadius: 10,
                                fontSize: 15,
                                fontWeight: 500,
                              }}
                            >
                              <span style={{ color: 'var(--ion-color-primary)', fontWeight: 700 }}>{item.quantity}x</span>
                              <span>{item.product_name}</span>
                            </div>
                          ))}
                        </div>
                      </IonLabel>
                    </IonItem>
                  )}

                  {delivery.order_total != null && delivery.order_total > 0 && (
                    <IonItem style={{ '--background': 'transparent', '--padding-start': 0, '--inner-padding-end': 0 } as React.CSSProperties}>
                      <IonLabel>
                        <p style={{ color: 'var(--ion-color-medium)', fontSize: 12 }}>Valor total</p>
                        <h2 style={{ fontWeight: 700, fontSize: 20, marginTop: 4, color: 'var(--ion-color-success)' }}>
                          R$ {delivery.order_total.toFixed(2)}
                        </h2>
                      </IonLabel>
                    </IonItem>
                  )}

                  {delivery.notes && (
                    <IonItem style={{ '--background': 'transparent', '--padding-start': 0, '--inner-padding-end': 0 } as React.CSSProperties}>
                      <IonLabel className="ion-text-wrap">
                        <p style={{ color: 'var(--ion-color-medium)', fontSize: 12 }}>Observações</p>
                        <p style={{ fontSize: 14, marginTop: 4, lineHeight: 1.5 }}>
                          {delivery.notes}
                        </p>
                      </IonLabel>
                    </IonItem>
                  )}
                </IonList>
              </IonCardContent>
            </IonCard>

            {/* Botões de Status - Maiores */}
            {showStatusButtons && (
              <IonCard style={{ margin: '0 0 20px', borderRadius: 14 }}>
                <IonCardContent style={{ padding: 20 }}>
                  <p style={{ margin: '0 0 16px', fontWeight: 600, fontSize: 16 }}>
                    Atualizar status
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {STATUS_OPTIONS.map((opt) => {
                      const isCurrentStatus = delivery.status === opt.value
                      const isUpdating = updating === opt.value

                      return (
                        <IonButton
                          key={opt.value}
                          fill={isCurrentStatus ? 'solid' : 'outline'}
                          style={{
                            minWidth: 100,
                            height: 48,
                            '--border-radius': '10px',
                            fontWeight: 600,
                            '--background': opt.colorVar,
                            '--color': 'white',
                            '--border-color': opt.colorVar,
                            '--color-hover': 'white',
                            '--color-activated': 'white',
                          } as React.CSSProperties}
                          disabled={isCurrentStatus || updating !== null}
                          onClick={() => handleStatusChange(opt.value)}
                        >
                          {isUpdating ? (
                            <IonSpinner name="crescent" style={{ width: 20, height: 20 }} />
                          ) : (
                            <>
                              {opt.value === 'delivered' && (
                                <IonIcon icon={cameraOutline} slot="start" style={{ marginRight: 6 }} />
                              )}
                              {opt.label}
                            </>
                          )}
                        </IonButton>
                      )
                    })}
                  </div>
                </IonCardContent>
              </IonCard>
            )}

            {/* Mensagem para entregas finalizadas */}
            {!showStatusButtons && delivery.status === 'delivered' && (
              <IonCard style={{ margin: 0, borderRadius: 14, background: 'var(--gradient-primary)' }}>
                <IonCardContent style={{ padding: 24, textAlign: 'center', color: 'white' }}>
                  <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 48, marginBottom: 12 }} />
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>Entrega concluída!</p>
                  <p style={{ margin: '8px 0 0', fontSize: 14, opacity: 0.95 }}>
                    Foto de comprovante registrada com sucesso.
                  </p>
                </IonCardContent>
              </IonCard>
            )}

            {!showStatusButtons && delivery.status === 'failed' && (
              <div
                style={{
                  background: 'var(--ion-color-danger-shade)',
                  padding: 20,
                  borderRadius: 14,
                  textAlign: 'center',
                }}
              >
                <p style={{ margin: 0, color: 'var(--ion-color-danger-contrast)', fontWeight: 600 }}>
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
