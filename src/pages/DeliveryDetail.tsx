/**
 * Delivery Detail — Map-First Layout (Uber Style)
 * Full-screen map with route/dest marker, Bottom Sheet, and Swipe-to-Action.
 */

import {
  IonContent,
  IonIcon,
  IonPage,
  useIonToast,
} from '@ionic/react'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import {
  getDeliveryById,
  updateDeliveryStatus,
  getStatusLabel,
  type Delivery,
  type DeliveryStatus,
} from '../services/api'
import { getErrorMessage, isNetworkError } from '../utils/errorHandler'
import { openNavigation } from '../utils/navigation'
import { useConfirm, CONFIRM_PRESETS } from '../hooks/useConfirm'
import { DeliveryDetailSkeleton } from '../components/Skeletons'
import { ErrorState, OfflineState, EmptyState } from '../components/EmptyState'
import {
  alertCircleOutline,
  callOutline,
  checkmarkCircleOutline,
  navigateOutline,
  personCircleOutline,
  chevronForwardOutline,
} from 'ionicons/icons'
import { takeDeliveryPhoto, uploadDeliveryProof } from '../services/camera'
import { InteractiveMap } from '../components/InteractiveMap'
import { BottomSheet } from '../components/BottomSheet'
import { SwipeButton } from '../components/SwipeButton'

// ============================================================================
// HELPERS
// ============================================================================

function getNextStatus(current: DeliveryStatus): { next: DeliveryStatus | null; label: string } {
  if (current === 'pending') return { next: 'assigned', label: 'Aceitar OS' }
  if (current === 'assigned') return { next: 'picked_up', label: 'Deslize p/ Retirar' }
  if (current === 'picked_up') return { next: 'in_transit', label: 'Iniciar Rota' }
  if (current === 'in_transit') return { next: 'arrived', label: 'Cheguei no Local' }
  if (current === 'arrived') return { next: 'delivered', label: 'Finalizar Entrega' }
  return { next: null, label: '' }
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
// PAGE
// ============================================================================

export default function DeliveryDetail() {
  const { id } = useParams<{ id: string }>()
  const history = useHistory()
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

  const handleStatusChange = async (status: DeliveryStatus) => {
    if (!id || !delivery) return

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

  const statusColor = useMemo(() => {
    if (!delivery) return '#8B9AB0'
    return STATUS_COLORS[delivery.status] || '#8B9AB0'
  }, [delivery])

  const { next: nextStatus, label: swipeLabel } = getNextStatus(delivery?.status || 'delivered')
  const addressStr = delivery?.delivery_address_str || delivery?.address || delivery?.bairro || 'Endereço não informado'

  return (
    <IonPage>
      <IonContent fullscreen style={{ '--background': '#1A1F2E' }}>

        {loading && <DeliveryDetailSkeleton />}
        {!loading && isOffline && <OfflineState onRetry={load} />}
        {!loading && !isOffline && error && <ErrorState message={error} onRetry={load} />}
        {!loading && !error && !delivery && (
          <EmptyState icon={alertCircleOutline} title="OS não encontrada"
            message="Esta OS pode ter sido removida ou você não tem acesso."
            action={{ label: 'Voltar', onClick: () => history.replace('/dashboard') }} />
        )}

        {!loading && !error && delivery && (
          <>
            {/* Immersive Map Background */}
            <InteractiveMap currentPosition={null} />

            {/* Top Navigation Bar / Address Card */}
            <div style={{
              position: 'absolute', top: 40, left: 16, right: 16, zIndex: 1000,
            }}>
              <div style={{
                background: '#1A1F2E', borderRadius: 20, padding: '16px',
                display: 'flex', alignItems: 'center', gap: 14,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.07)'
              }}>
                <button
                  onClick={() => history.goBack()}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <IonIcon icon={chevronForwardOutline} style={{ fontSize: 24, color: 'white', transform: 'rotate(180deg)' }} />
                </button>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    ID: #{delivery.order_number || String(delivery.id).slice(0, 8)}
                  </span>
                  <p style={{ margin: '2px 0 0', fontSize: 14, color: 'white', fontWeight: 600, lineHeight: 1.3 }}>
                    Drop off at {addressStr.split(',')[0]}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: '#8B9AB0' }}>
                    {delivery.bairro || 'Sem complemento'}
                  </p>
                </div>
              </div>
            </div>

            {/* Floating Action Buttons Right (Navigate, Recenter) */}
            <div style={{
              position: 'absolute', bottom: 330, right: 16, zIndex: 1000,
              display: 'flex', flexDirection: 'column', gap: 12
            }}>
              <button
                onClick={() => openNavigation(addressStr)}
                style={{
                  width: 50, height: 50, borderRadius: 25, background: 'linear-gradient(135deg, #FF6B35, #E55A26)',
                  border: 'none', boxShadow: '0 4px 16px rgba(255,107,53,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <IonIcon icon={navigateOutline} style={{ color: 'white', fontSize: 24 }} />
              </button>
            </div>

            {/* Bottom Sheet Context */}
            <BottomSheet initialHeight={300} maxHeight="85vh">
              {/* Customer Info Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,107,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IonIcon icon={personCircleOutline} style={{ fontSize: 48, color: '#FF6B35' }} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 20, color: 'white', fontWeight: 800 }}>
                      {delivery.customer_name || 'Cliente'}
                    </h2>
                    <span style={{
                      display: 'inline-block', marginTop: 4, padding: '4px 10px', background: `${statusColor}22`,
                      color: statusColor, borderRadius: 8, fontSize: 12, fontWeight: 700,
                      border: `1px solid ${statusColor}44`,
                    }}>
                      {getStatusLabel(delivery.status)}
                    </span>
                  </div>
                </div>

                {delivery.customer_phone && (
                  <a href={`tel:${delivery.customer_phone}`} style={{ textDecoration: 'none' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IonIcon icon={callOutline} style={{ fontSize: 22, color: 'white' }} />
                    </div>
                  </a>
                )}
              </div>

              {/* Order Info Cards */}
              <div style={{ background: '#252D3D', borderRadius: 16, padding: '16px', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12, marginBottom: 12 }}>
                  <span style={{ color: '#8B9AB0', fontSize: 13, fontWeight: 600 }}>Valor a cobrar</span>
                  <span style={{ color: '#10B981', fontSize: 16, fontWeight: 800 }}>
                    R$ {delivery.order_total?.toFixed(2) || '0.00'}
                  </span>
                </div>
                {delivery.order_items && delivery.order_items.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {delivery.order_items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ background: '#FF6B35', color: 'white', borderRadius: 6, padding: '2px 6px', fontSize: 12, fontWeight: 800 }}>{item.quantity}x</span>
                        <span style={{ color: 'white', fontSize: 14 }}>{item.product_name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: '#8B9AB0', fontSize: 13 }}>Nenhum item especificado</span>
                )}

                {delivery.notes && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ color: '#8B9AB0', fontSize: 12, fontWeight: 600 }}>Observações:</span>
                    <p style={{ margin: '4px 0 0', color: 'white', fontSize: 14 }}>{delivery.notes}</p>
                  </div>
                )}
              </div>

              {/* Swipe Action or Finished Card */}
              {nextStatus ? (
                <SwipeButton
                  text={swipeLabel}
                  color={nextStatus === 'delivered' ? '#10B981' : '#FF6B35'}
                  textColor="white"
                  loading={updating !== null}
                  onComplete={() => handleStatusChange(nextStatus)}
                />
              ) : delivery.status === 'delivered' ? (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.08))',
                  borderRadius: 20, padding: 20, textAlign: 'center',
                  border: '1.5px solid rgba(16,185,129,0.3)',
                }}>
                  <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 32, color: '#10B981', marginBottom: 8 }} />
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 18, color: 'white' }}>OS concluída!</p>
                </div>
              ) : delivery.status === 'failed' ? (
                <div style={{ background: 'rgba(248,113,113,0.1)', borderRadius: 20, padding: 20, border: '1.5px solid rgba(248,113,113,0.25)', textAlign: 'center' }}>
                  <p style={{ margin: 0, color: '#F87171', fontWeight: 700 }}>OS Falha / Cancelada</p>
                </div>
              ) : null}

              {/* Auxiliary Actions (Fail) */}
              {nextStatus && (
                <button
                  disabled={updating !== null}
                  onClick={() => handleStatusChange('failed')}
                  style={{
                    width: '100%', padding: '16px', background: 'transparent',
                    border: 'none', color: '#8B9AB0', fontWeight: 600, fontSize: 14,
                    marginTop: 8, cursor: 'pointer'
                  }}
                >
                  Reportar problema / Falha
                </button>
              )}
            </BottomSheet>
          </>
        )}
      </IonContent>
    </IonPage>
  )
}
