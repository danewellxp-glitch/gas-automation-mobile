/**
 * Skeleton Loading Components
 *
 * Componentes de loading que mostram a estrutura da página
 * enquanto os dados estão sendo carregados.
 * Melhor UX que spinner genérico.
 */

import { IonSkeletonText } from '@ionic/react'

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
 * Skeleton para lista de entregas (cards)
 */
export function DeliveryListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div style={{ padding: '8px 16px 24px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: 'var(--ion-color-light)',
            padding: 18,
            borderRadius: 14,
            marginBottom: 12,
          }}
        >
          <IonSkeletonText animated style={{ width: '45%', height: 18, marginBottom: 10 }} />
          <IonSkeletonText animated style={{ width: '80%', height: 14, marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <IonSkeletonText animated style={{ width: 80, height: 24, borderRadius: 8 }} />
            <IonSkeletonText animated style={{ width: 60, height: 24, borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton para detalhes de entrega (timeline, mapa, cards)
 */
export function DeliveryDetailSkeleton() {
  return (
    <div className="ion-padding">
      <IonSkeletonText animated style={{ width: 100, height: 32, borderRadius: 12, marginBottom: 20 }} />
      <IonSkeletonText animated style={{ width: '100%', height: 52, borderRadius: 12, marginBottom: 20 }} />

      {/* Timeline */}
      <div style={{ background: 'var(--ion-color-light)', padding: 20, borderRadius: 14, marginBottom: 20 }}>
        <IonSkeletonText animated style={{ width: '40%', height: 14, marginBottom: 16 }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, marginBottom: i < 4 ? 20 : 0 }}>
            <IonSkeletonText animated style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0 }} />
            <IonSkeletonText animated style={{ width: '60%', height: 16 }} />
          </div>
        ))}
      </div>

      {/* Mapa placeholder */}
      <div style={{ background: 'var(--ion-color-light)', height: 140, borderRadius: 14, marginBottom: 20 }} />

      {/* Detalhes card */}
      <div style={{ background: 'var(--ion-color-light)', padding: 20, borderRadius: 14, marginBottom: 20 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ marginBottom: i < 3 ? 16 : 0 }}>
            <IonSkeletonText animated style={{ width: '30%', height: 12, marginBottom: 8 }} />
            <IonSkeletonText animated style={{ width: i === 1 ? '90%' : '60%', height: 16 }} />
          </div>
        ))}
      </div>

      {/* Botões de status */}
      <IonSkeletonText animated style={{ width: '45%', height: 16, marginBottom: 12 }} />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <IonSkeletonText key={i} animated style={{ width: 100, height: 48, borderRadius: 10 }} />
        ))}
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
