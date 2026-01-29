/**
 * Skeleton Loading Components
 *
 * Componentes de loading que mostram a estrutura da página
 * enquanto os dados estão sendo carregados.
 * Melhor UX que spinner genérico.
 */

import { IonItem, IonLabel, IonList, IonSkeletonText } from '@ionic/react'

/**
 * Skeleton para cards de estatísticas do Dashboard
 */
export function DashboardSkeleton() {
  return (
    <div className="ion-padding">
      {/* Saudação */}
      <IonSkeletonText animated style={{ width: '40%', height: 20, marginBottom: 16 }} />

      {/* Card de Status */}
      <div
        style={{
          background: 'var(--ion-color-light)',
          padding: 20,
          borderRadius: 12,
          marginBottom: 16,
        }}
      >
        <IonSkeletonText animated style={{ width: '30%', height: 14, marginBottom: 8 }} />
        <IonSkeletonText animated style={{ width: '50%', height: 24, marginBottom: 12 }} />
        <IonSkeletonText animated style={{ width: '40%', height: 32, borderRadius: 4 }} />
      </div>

      {/* Grid de estatísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: 'var(--ion-color-light)', padding: 16, borderRadius: 12 }}>
          <IonSkeletonText animated style={{ width: '40%', height: 12, marginBottom: 8 }} />
          <IonSkeletonText animated style={{ width: '30%', height: 28, marginBottom: 4 }} />
          <IonSkeletonText animated style={{ width: '50%', height: 12 }} />
        </div>
        <div style={{ background: 'var(--ion-color-light)', padding: 16, borderRadius: 12 }}>
          <IonSkeletonText animated style={{ width: '40%', height: 12, marginBottom: 8 }} />
          <IonSkeletonText animated style={{ width: '30%', height: 28, marginBottom: 4 }} />
          <IonSkeletonText animated style={{ width: '50%', height: 12 }} />
        </div>
      </div>

      {/* Botão */}
      <IonSkeletonText
        animated
        style={{ width: '100%', height: 44, borderRadius: 8, marginTop: 24 }}
      />
    </div>
  )
}

/**
 * Skeleton para lista de entregas
 */
export function DeliveryListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <IonList lines="full">
      {Array.from({ length: count }).map((_, i) => (
        <IonItem key={i}>
          <IonLabel>
            <IonSkeletonText animated style={{ width: '40%', height: 18, marginBottom: 8 }} />
            <IonSkeletonText animated style={{ width: '70%', height: 14, marginBottom: 4 }} />
            <IonSkeletonText animated style={{ width: '30%', height: 14 }} />
          </IonLabel>
        </IonItem>
      ))}
    </IonList>
  )
}

/**
 * Skeleton para detalhes de entrega
 */
export function DeliveryDetailSkeleton() {
  return (
    <div className="ion-padding">
      <IonList lines="full">
        {Array.from({ length: 4 }).map((_, i) => (
          <IonItem key={i}>
            <IonLabel>
              <IonSkeletonText animated style={{ width: '30%', height: 16, marginBottom: 8 }} />
              <IonSkeletonText animated style={{ width: '60%', height: 14 }} />
            </IonLabel>
          </IonItem>
        ))}
      </IonList>

      <div style={{ marginTop: 24 }}>
        <IonSkeletonText animated style={{ width: '40%', height: 18, marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <IonSkeletonText
              key={i}
              animated
              style={{ width: 80, height: 32, borderRadius: 4 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton genérico para card
 */
export function CardSkeleton() {
  return (
    <div
      style={{
        background: 'var(--ion-color-light)',
        padding: 16,
        borderRadius: 12,
      }}
    >
      <IonSkeletonText animated style={{ width: '60%', height: 16, marginBottom: 8 }} />
      <IonSkeletonText animated style={{ width: '80%', height: 14 }} />
    </div>
  )
}
