/**
 * Delivery Detail — Dark Theme
 * Detalhes de uma OS com timeline, datas e atualização de status.
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
  personOutline,
  receiptOutline,
} from 'ionicons/icons'
import { takeDeliveryPhoto, uploadDeliveryProof } from '../services/camera'

// ============================================================================
// CONSTANTS
// ============================================================================

const DELIVERY_STAGES: { status: DeliveryStatus; label: string }[] = [
  { status: 'assigned', label: 'Atribuída' },
  { status: 'picked_up', label: 'Retirada' },
  { status: 'in_transit', label: 'Em rota' },
  { status: 'arrived', label: 'Chegou' },
  { status: 'delivered', label: 'Entregue' },
]

const STATUS_OPTIONS: { value: DeliveryStatus; label: string; color: string }[] = [
  { value: 'picked_up', label: 'Retirada', color: '#60A5FA' },
  { value: 'in_transit', label: 'Em rota', color: '#A78BFA' },
  { value: 'arrived', label: 'Chegou', color: '#34D399' },
  { value: 'delivered', label: 'Entregue', color: '#10B981' },
  { value: 'failed', label: 'Falha', color: '#F87171' },
]

const STATUS_COLORS: Partial<Record<DeliveryStatus, string>> = {
  pending: '#FBBF24',
  assigned: '#60A5FA',
  picked_up: '#60A5FA',
  in_transit: '#A78BFA',
  arrived: '#34D399',
  delivered: '#10B981',
  failed: '#F87171',
  returned: '#8B9AB0',
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDT(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StatusTimeline({ delivery }: { delivery: Delivery }) {
  const statusOrder: DeliveryStatus[] = ['assigned', 'picked_up', 'in_transit', 'arrived', 'delivered']
  const currentIdx = statusOrder.indexOf(delivery.status)
  const isFailed = delivery.status === 'failed'

  const stageDates: Partial<Record<DeliveryStatus, string | undefined>> = {
    assigned: delivery.assigned_at,
    picked_up: delivery.picked_up_at,
    in_transit: delivery.in_transit_at,
    arrived: delivery.arrived_at,
    delivered: delivery.delivered_at,
  }

  return (
    <div style={{
      background: '#1A1F2E', borderRadius: 20, padding: 20,
      border: '1px solid rgba(255,255,255,0.07)', marginBottom: 16,
    }}>
      <p style={{ margin: '0 0 20px', fontSize: 12, fontWeight: 700, color: '#4B5A6E', textTransform: 'uppercase', letterSpacing: 1 }}>
        Andamento da OS
      </p>
      {DELIVERY_STAGES.map((stage, i) => {
        const stepIdx = statusOrder.indexOf(stage.status)
        const isCompleted = isFailed
          ? stage.status !== 'delivered' && stepIdx < currentIdx
          : stepIdx <= currentIdx
        const isCurrent = delivery.status === stage.status && !isFailed
        const isLast = i === DELIVERY_STAGES.length - 1
        const dateLabel = formatDT(stageDates[stage.status])

        return (
          <div key={stage.status} style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24 }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                background: isCompleted || isCurrent ? '#FF6B35' : '#252D3D',
                border: `2.5px solid ${isCompleted || isCurrent ? '#FF6B35' : '#2D3748'}`,
                boxShadow: isCurrent ? '0 0 12px rgba(255,107,53,0.5)' : 'none',
              }} />
              {!isLast && (
                <div style={{
                  width: 2, flex: 1, minHeight: 32, marginTop: 4,
                  background: isCompleted ? '#FF6B35' : '#252D3D',
                }} />
              )}
            </div>
            <div style={{ marginLeft: 14, paddingBottom: isLast ? 0 : 4, flex: 1 }}>
              <p style={{
                margin: 0, fontSize: 15, fontWeight: isCurrent ? 800 : 500,
                color: isCompleted || isCurrent ? 'white' : '#4B5A6E',
              }}>
                {stage.label}
              </p>
              {dateLabel && (
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#FF6B35', fontWeight: 600 }}>
                  {dateLabel}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MapSection({ address }: { address: string }) {
  if (!address) return null
  return (
    <div style={{
      background: '#1A1F2E', borderRadius: 20, overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.07)', marginBottom: 16,
    }}>
      <div style={{
        height: 130, background: 'linear-gradient(135deg, #1A1F2E 0%, #252D3D 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 10, position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid decorativo */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: 'linear-gradient(#FF6B35 1px, transparent 1px), linear-gradient(90deg, #FF6B35 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
        <IonIcon icon={locateOutline} style={{ fontSize: 36, color: '#FF6B35', position: 'relative' }} />
        <p style={{ margin: 0, fontSize: 13, color: '#8B9AB0', textAlign: 'center', padding: '0 24px', position: 'relative' }}>
          {address}
        </p>
      </div>
      <div style={{ padding: '12px 16px' }}>
        <button
          onClick={() => openNavigation(address)}
          style={{
            width: '100%', height: 46, borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #FF6B35, #E55A26)',
            color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 16px rgba(255,107,53,0.3)',
          }}
        >
          <IonIcon icon={navigateOutline} style={{ fontSize: 18 }} />
          Abrir no mapa
        </button>
      </div>
    </div>
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

  const load = useCallback(async () => {
    if (!id) return
    try {
      setError(null)
      setIsOffline(false)
      const data = await getDeliveryById(id)
      setDelivery(data)
    } catch (e: unknown) {
      if (isNetworkError(e)) setIsOffline(true)
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const onRefresh = async (e: CustomEvent<RefresherEventDetail>) => {
    await load(); e.detail.complete()
  }

  const handleStatusChange = async (status: DeliveryStatus) => {
    if (!id) return

    if (status === 'delivered') {
      const { confirmed } = await confirm({
        header: 'Foto de comprovante',
        message: 'Tire uma foto como prova de entrega.',
        confirmText: 'Tirar foto', cancelText: 'Cancelar',
      })
      if (!confirmed) return
      const photo = await takeDeliveryPhoto()
      if (!photo) {
        await presentToast({ message: 'Foto obrigatória para confirmar entrega.', duration: 3000, color: 'warning', position: 'top' })
        return
      }
      setUpdating(status)
      try {
        await uploadDeliveryProof(id, photo)
        await updateDeliveryStatus(id, status)
        await presentToast({ message: 'Entrega confirmada!', duration: 2000, color: 'success', position: 'top' })
        await load()
      } catch (e: unknown) {
        await presentToast({ message: getErrorMessage(e), duration: 3000, color: 'danger', position: 'top' })
      } finally { setUpdating(null) }
      return
    }

    const preset = status === 'failed' ? CONFIRM_PRESETS.failDelivery : CONFIRM_PRESETS.changeStatus(getStatusLabel(status))
    const { confirmed } = await confirm(preset)
    if (!confirmed) return
    setUpdating(status)
    try {
      await updateDeliveryStatus(id, status)
      await presentToast({ message: `Status: ${getStatusLabel(status)}`, duration: 2000, color: 'success', position: 'top' })
      await load()
    } catch (e: unknown) {
      await presentToast({ message: getErrorMessage(e), duration: 3000, color: 'danger', position: 'top' })
    } finally { setUpdating(null) }
  }

  const showStatusButtons = useMemo(() => delivery && canUpdateStatus(delivery.status), [delivery])
  const statusColor = useMemo(() => {
    if (!delivery) return '#8B9AB0'
    return STATUS_COLORS[delivery.status] || '#8B9AB0'
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
          <IonTitle style={{ fontWeight: 800, color: 'white' }}>Detalhe da OS</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <NetworkStatusBanner onRetry={load} />
        <IonRefresher slot="fixed" onIonRefresh={onRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {loading && <DeliveryDetailSkeleton />}
        {!loading && isOffline && <OfflineState onRetry={load} />}
        {!loading && !isOffline && error && <ErrorState message={error} onRetry={load} />}
        {!loading && !error && !delivery && (
          <EmptyState icon={alertCircleOutline} title="OS não encontrada"
            message="Esta OS pode ter sido removida ou você não tem acesso."
            action={{ label: 'Voltar', onClick: () => window.history.back() }} />
        )}

        {!loading && !error && delivery && (
          <div style={{ padding: '16px 16px 40px' }}>

            {/* Header da OS: número + status badge */}
            <div style={{
              background: '#1A1F2E', borderRadius: 20, padding: 20,
              border: '1px solid rgba(255,255,255,0.07)', marginBottom: 16,
              borderLeft: `4px solid ${statusColor}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IonIcon icon={receiptOutline} style={{ fontSize: 18, color: '#FF6B35' }} />
                  <span style={{ fontSize: 13, color: '#8B9AB0', fontWeight: 600 }}>Ordem de Serviço</span>
                </div>
                <span style={{
                  padding: '5px 14px', background: `${statusColor}22`,
                  color: statusColor, borderRadius: 10, fontSize: 13, fontWeight: 700,
                  border: `1px solid ${statusColor}44`,
                }}>
                  {getStatusLabel(delivery.status)}
                </span>
              </div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'white' }}>
                #{delivery.order_number || String(delivery.order_id || delivery.id).slice(0, 8)}
              </h2>
              {delivery.customer_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <IonIcon icon={personOutline} style={{ fontSize: 14, color: '#4B5A6E' }} />
                  <span style={{ fontSize: 15, color: '#c0cad4', fontWeight: 500 }}>{delivery.customer_name}</span>
                </div>
              )}
            </div>

            {/* Botão ligar */}
            {delivery.customer_phone && (
              <a href={`tel:${delivery.customer_phone}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 16 }}>
                <div style={{
                  height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #FF6B35, #E55A26)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 8px 24px rgba(255,107,53,0.35)',
                }}>
                  <IonIcon icon={callOutline} style={{ fontSize: 22, color: 'white' }} />
                  <span style={{ color: 'white', fontWeight: 800, fontSize: 17 }}>Ligar para cliente</span>
                </div>
              </a>
            )}

            {/* Timeline */}
            <StatusTimeline delivery={delivery} />

            {/* Mapa */}
            <MapSection address={delivery.delivery_address_str || delivery.address || delivery.bairro || ''} />

            {/* Detalhes */}
            <div style={{
              background: '#1A1F2E', borderRadius: 20, padding: 20,
              border: '1px solid rgba(255,255,255,0.07)', marginBottom: 16,
            }}>
              <p style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 700, color: '#4B5A6E', textTransform: 'uppercase', letterSpacing: 1 }}>
                Informações
              </p>

              {/* Endereço */}
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: '#4B5A6E' }}>Endereço</p>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <p style={{ margin: 0, fontSize: 15, color: 'white', lineHeight: 1.4 }}>
                    {delivery.delivery_address_str || delivery.address || delivery.bairro || 'Não informado'}
                    {delivery.bairro && (delivery.delivery_address_str || delivery.address) && (
                      <span style={{ color: '#8B9AB0' }}> — {delivery.bairro}</span>
                    )}
                  </p>
                  {(delivery.delivery_address_str || delivery.address || delivery.bairro) && (
                    <button
                      onClick={() => openNavigation(delivery.delivery_address_str || delivery.address || delivery.bairro || '')}
                      style={{
                        flexShrink: 0, height: 36, padding: '0 12px', borderRadius: 10,
                        border: '1.5px solid rgba(255,107,53,0.4)', background: 'rgba(255,107,53,0.1)',
                        color: '#FF6B35', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      <IonIcon icon={navigateOutline} style={{ fontSize: 15 }} />
                      Navegar
                    </button>
                  )}
                </div>
              </div>

              {/* Itens */}
              {delivery.order_items && delivery.order_items.length > 0 && (
                <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: '#4B5A6E' }}>Itens da OS</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {delivery.order_items.map((item, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', background: '#252D3D', borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}>
                        <span style={{
                          minWidth: 32, height: 32, borderRadius: 10, background: 'rgba(255,107,53,0.18)',
                          color: '#FF6B35', fontWeight: 800, fontSize: 14,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>{item.quantity}x</span>
                        <span style={{ fontSize: 15, color: 'white', fontWeight: 500 }}>{item.product_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Valor total */}
              {delivery.order_total != null && delivery.order_total > 0 && (
                <div style={{ marginBottom: delivery.notes ? 16 : 0, paddingBottom: delivery.notes ? 16 : 0, borderBottom: delivery.notes ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#4B5A6E' }}>Valor total</p>
                  <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#10B981' }}>
                    R$ {delivery.order_total.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Observações */}
              {delivery.notes && (
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#4B5A6E' }}>Observações</p>
                  <p style={{ margin: 0, fontSize: 14, color: '#8B9AB0', lineHeight: 1.5 }}>{delivery.notes}</p>
                </div>
              )}
            </div>

            {/* Botões de status */}
            {showStatusButtons && (
              <div style={{
                background: '#1A1F2E', borderRadius: 20, padding: 20,
                border: '1px solid rgba(255,255,255,0.07)', marginBottom: 16,
              }}>
                <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#4B5A6E', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Atualizar status
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {STATUS_OPTIONS.map((opt) => {
                    const isCurrent = delivery.status === opt.value
                    const isUpdating = updating === opt.value
                    return (
                      <button
                        key={opt.value}
                        disabled={isCurrent || updating !== null}
                        onClick={() => handleStatusChange(opt.value)}
                        style={{
                          width: '100%', height: 50, borderRadius: 14, cursor: 'pointer',
                          background: isCurrent ? `${opt.color}33` : `${opt.color}18`,
                          color: opt.color, fontWeight: 700, fontSize: 15,
                          border: `1.5px solid ${isCurrent ? opt.color : opt.color + '44'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          opacity: updating && !isUpdating ? 0.5 : 1,
                        } as React.CSSProperties}
                      >
                        {isUpdating
                          ? <IonSpinner name="crescent" style={{ width: 20, height: 20, color: opt.color }} />
                          : <>
                              {opt.value === 'delivered' && <IonIcon icon={cameraOutline} style={{ fontSize: 18 }} />}
                              {opt.label}
                              {isCurrent && <span style={{ fontSize: 12, opacity: 0.7 }}>(atual)</span>}
                            </>
                        }
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Entregue */}
            {!showStatusButtons && delivery.status === 'delivered' && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.08))',
                borderRadius: 20, padding: 28, textAlign: 'center',
                border: '1.5px solid rgba(16,185,129,0.3)',
              }}>
                <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 52, color: '#10B981', marginBottom: 12 }} />
                <p style={{ margin: 0, fontWeight: 800, fontSize: 20, color: 'white' }}>OS concluída!</p>
                <p style={{ margin: '8px 0 0', fontSize: 14, color: '#8B9AB0' }}>Comprovante registrado.</p>
              </div>
            )}

            {/* Falha */}
            {!showStatusButtons && delivery.status === 'failed' && (
              <div style={{
                background: 'rgba(248,113,113,0.1)', borderRadius: 20, padding: 20,
                border: '1.5px solid rgba(248,113,113,0.25)', textAlign: 'center',
              }}>
                <p style={{ margin: 0, color: '#F87171', fontWeight: 700 }}>
                  Esta OS foi marcada como falha.
                </p>
              </div>
            )}
          </div>
        )}
      </IonContent>
    </IonPage>
  )
}
