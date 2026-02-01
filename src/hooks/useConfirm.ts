/**
 * Hook de Confirmação para Ações Críticas
 *
 * Fornece uma forma consistente de pedir confirmação ao motorista
 * antes de ações importantes como aceitar/finalizar entregas.
 */

import { useIonAlert } from '@ionic/react'
import { useCallback } from 'react'

export interface ConfirmOptions {
  header?: string
  message: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
}

export interface ConfirmResult {
  confirmed: boolean
}

/**
 * Hook que retorna função de confirmação usando IonAlert
 */
export function useConfirm() {
  const [presentAlert] = useIonAlert()

  const confirm = useCallback(
    (options: ConfirmOptions): Promise<ConfirmResult> => {
      return new Promise((resolve) => {
        let resolved = false
        const safeResolve = (result: ConfirmResult) => {
          if (!resolved) {
            resolved = true
            resolve(result)
          }
        }
        presentAlert({
          header: options.header || 'Confirmar',
          message: options.message,
          backdropDismiss: false,
          buttons: [
            {
              text: options.cancelText || 'Cancelar',
              role: 'cancel',
              handler: () => safeResolve({ confirmed: false }),
            },
            {
              text: options.confirmText || 'Confirmar',
              role: options.destructive ? 'destructive' : undefined,
              handler: () => safeResolve({ confirmed: true }),
            },
          ],
          onDidDismiss: () => safeResolve({ confirmed: false }),
        })
      })
    },
    [presentAlert]
  )

  return { confirm }
}

/**
 * Configurações pré-definidas para ações comuns
 */
export const CONFIRM_PRESETS = {
  acceptDelivery: {
    header: 'Aceitar Entrega',
    message: 'Deseja aceitar esta entrega? Você será responsável pela conclusão.',
    confirmText: 'Aceitar',
    cancelText: 'Voltar',
  },
  startDelivery: {
    header: 'Iniciar Entrega',
    message: 'Confirma que está saindo para a entrega?',
    confirmText: 'Confirmar',
  },
  completeDelivery: {
    header: 'Finalizar Entrega',
    message: 'Confirma que a entrega foi realizada com sucesso?',
    confirmText: 'Finalizar',
  },
  failDelivery: {
    header: 'Marcar como Falha',
    message: 'Deseja marcar esta entrega como falha? Esta ação não pode ser desfeita.',
    confirmText: 'Sim, falha',
    cancelText: 'Voltar',
    destructive: true,
  },
  changeStatus: (newStatus: string) => ({
    header: 'Alterar Status',
    message: `Deseja alterar o status para "${newStatus}"?`,
    confirmText: 'Alterar',
  }),
  logout: {
    header: 'Sair',
    message: 'Deseja sair do aplicativo?',
    confirmText: 'Sair',
    cancelText: 'Ficar',
  },
  goOffline: {
    header: 'Ficar Offline',
    message: 'Você não receberá novas entregas enquanto estiver offline. Deseja continuar?',
    confirmText: 'Ficar offline',
    cancelText: 'Cancelar',
  },
} as const
