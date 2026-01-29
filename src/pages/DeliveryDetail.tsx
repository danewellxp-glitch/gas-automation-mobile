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
  useIonAlert,
} from '@ionic/react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getDriverDeliveries, updateDeliveryStatus, type Delivery } from '../services/api'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'picked_up', label: 'Retirada' },
  { value: 'in_transit', label: 'Em rota' },
  { value: 'arrived', label: 'Chegou' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'failed', label: 'Falha' },
]

export default function DeliveryDetail() {
  const { id } = useParams<{ id: string }>()
  const [presentAlert] = useIonAlert()
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    try {
      setError(null)
      const list = await getDriverDeliveries('active')
      const found = list.find((d) => d.id === id)
      if (!found) {
        const completed = await getDriverDeliveries('completed')
        const fromCompleted = completed.find((d) => d.id === id)
        setDelivery(fromCompleted ?? null)
      } else {
        setDelivery(found)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar entrega')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const handleStatusChange = async (status: string) => {
    if (!id) return
    setUpdating(true)
    try {
      await updateDeliveryStatus(id, status)
      await load()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao atualizar status'
      await presentAlert({ header: 'Erro', message: msg, buttons: ['OK'] })
    } finally {
      setUpdating(false)
    }
  }

  const canUpdateStatus =
    delivery &&
    ['assigned', 'picked_up', 'in_transit', 'arrived'].includes(String(delivery.status))

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/deliveries" />
          </IonButtons>
          <IonTitle>Entrega</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        {loading && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <IonSpinner name="crescent" />
          </div>
        )}
        {error && (
          <p style={{ color: 'var(--ion-color-danger)', marginBottom: 16 }}>{error}</p>
        )}
        {!loading && delivery && (
          <>
            <IonList lines="full">
              <IonItem>
                <IonLabel>
                  <h2>Pedido</h2>
                  <p>#{String(delivery.order_id ?? delivery.id).slice(0, 8)}</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonLabel>
                  <h2>Status</h2>
                  <p>{String(delivery.status)}</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonLabel>
                  <h2>Endereço / Bairro</h2>
                  <p>{delivery.address ?? delivery.bairro ?? '—'}</p>
                </IonLabel>
              </IonItem>
              {delivery.customer_name && (
                <IonItem>
                  <IonLabel>
                    <h2>Cliente</h2>
                    <p>{delivery.customer_name}</p>
                  </IonLabel>
                </IonItem>
              )}
            </IonList>
            {canUpdateStatus && (
              <div style={{ marginTop: 24 }}>
                <p style={{ marginBottom: 12, fontWeight: 600 }}>Atualizar status</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {STATUS_OPTIONS.map((opt) => (
                    <IonButton
                      key={opt.value}
                      fill="outline"
                      size="small"
                      disabled={updating || delivery.status === opt.value}
                      onClick={() => handleStatusChange(opt.value)}
                    >
                      {updating ? <IonSpinner name="crescent" /> : opt.label}
                    </IonButton>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        {!loading && !delivery && !error && (
          <p style={{ textAlign: 'center', color: 'var(--ion-color-medium)' }}>
            Entrega não encontrada.
          </p>
        )}
      </IonContent>
    </IonPage>
  )
}
