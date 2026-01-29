/**
 * Error Boundary Component
 *
 * Captura erros de renderização e mostra uma UI amigável.
 * Evita que o app inteiro quebre por um erro em um componente.
 */

import { IonButton, IonContent, IonPage } from '@ionic/react'
import React, { Component, type ReactNode } from 'react'
import { logError } from '../utils/errorHandler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log para desenvolvimento (não envia dados sensíveis)
    logError('ErrorBoundary', { error: error.message, componentStack: errorInfo.componentStack })
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <IonPage>
          <IonContent className="ion-padding">
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                textAlign: 'center',
                padding: 24,
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  marginBottom: 16,
                }}
              >
                :(
              </div>
              <h2 style={{ margin: '0 0 8px', color: 'var(--ion-color-dark)' }}>
                Algo deu errado
              </h2>
              <p
                style={{
                  margin: '0 0 24px',
                  color: 'var(--ion-color-medium)',
                  maxWidth: 300,
                }}
              >
                Ocorreu um erro inesperado. Tente novamente ou reinicie o aplicativo.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <IonButton fill="outline" onClick={this.handleRetry}>
                  Tentar novamente
                </IonButton>
                <IonButton onClick={this.handleReload}>
                  Reiniciar app
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonPage>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
