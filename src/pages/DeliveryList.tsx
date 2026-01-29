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
} from '@ionic/react'
import { useCallback, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { getDriverDeliveries, acceptDelivery, type Delivery } from '../services/api'

type Filter = 'active' | 'pending' | 'completed'

export default function DeliveryList() {
  const history = useHistory()
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [filter, setFilter] = useState<Filter>('active')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const data = await getDriverDeliveries(filter)
      setDeliveries(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar entregas')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  const onRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await load()
    event.detail.complete()
  }

  const handleAccept = async (id: string) => {
    setAcceptingId(id)
    try {
      await acceptDelivery(id)
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao aceitar entrega')
    } finally {
      setAcceptingId(null)
    }
  }

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      pending: 'Pendente',
      assigned: 'Atribuída',
      picked_up: 'Retirada',
      in_transit: 'Em rota',
      arrived: 'Chegou',
      delivered: 'Entregue',
      failed: 'Falha',
      returned: 'Devolvida',
    }
    return map[s] ?? s
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/dashboard" />
          </IonButtons>
          <IonTitle>Entregas</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonButtons className="ion-padding-horizontal">
            <IonButton
              fill={filter === 'active' ? 'solid' : 'outline'}
              onClick={() => setFilter('active')}
            >
              Ativas
            </IonButton>
            <IonButton
              fill={filter === 'pending' ? 'solid' : 'outline'}
              onClick={() => setFilter('pending')}
            >
              Pendentes
            </IonButton>
            <IonButton
              fill={filter === 'completed' ? 'solid' : 'outline'}
              onClick={() => setFilter('completed')}
            >
              Concluídas
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={onRefresh}>
          <IonRefresherContent />
        </IonRefresher>
        {error && (
          <p style={{ padding: 16, color: 'var(--ion-color-danger)', margin: 0 }}>{error}</p>
        )}
        {loading && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <IonSpinner name="crescent" />
          </div>
        )}
        {!loading && (
          <IonList lines="full">
            {deliveries.length === 0 && (
              <IonItem>
                <IonLabel className="ion-text-center">Nenhuma entrega encontrada.</IonLabel>
              </IonItem>
            )}
            {deliveries.map((d) => (
              <IonItem
                key={d.id}
                button
                onClick={() => history.push(`/delivery/${d.id}`)}
                detail
              >
                <IonLabel>
                  <h2>#{String(d.order_id ?? d.id).slice(0, 8)}</h2>
                  <p>{d.bairro ?? d.address ?? '—'}</p>
                  <p>{statusLabel(String(d.status))}</p>
                </IonLabel>
                {filter === 'pending' && d.status === 'pending' && (
                  <IonButton
                    slot="end"
                    fill="solid"
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAccept(d.id)
                    }}
                    disabled={acceptingId === d.id}
                  >
                    {acceptingId === d.id ? <IonSpinner name="crescent" /> : 'Aceitar'}
                  </IonButton>
                )}
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  )
}
