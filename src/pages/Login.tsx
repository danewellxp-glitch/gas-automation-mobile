/**
 * Login Page
 *
 * Tela de autenticação do motorista.
 * UX otimizada para entrada rápida.
 */

import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  IonText,
  useIonAlert,
} from '@ionic/react'
import { useState, useEffect, useRef } from 'react'
import { useHistory } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils/errorHandler'
import { NetworkStatusBanner } from '../components/NetworkStatus'

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Valida formato de email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// ============================================================================
// PAGE
// ============================================================================

export default function Login() {
  const history = useHistory()
  const { login, isAuthenticated, isLoading } = useAuth()
  const [presentAlert] = useIonAlert()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const emailInputRef = useRef<HTMLIonInputElement>(null)

  /**
   * Redireciona se já autenticado
   */
  useEffect(() => {
    if (isAuthenticated) {
      history.replace('/dashboard')
    }
  }, [isAuthenticated, history])

  /**
   * Foca no campo de email ao montar
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      emailInputRef.current?.setFocus()
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  /**
   * Valida email em tempo real
   */
  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (value && !isValidEmail(value)) {
      setEmailError('E-mail invalido')
    } else {
      setEmailError(null)
    }
  }

  /**
   * Submit do formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação
    if (!email.trim()) {
      await presentAlert({
        header: 'Campo obrigatorio',
        message: 'Informe seu e-mail.',
        buttons: ['OK'],
      })
      return
    }

    if (!isValidEmail(email.trim())) {
      await presentAlert({
        header: 'E-mail invalido',
        message: 'Informe um e-mail valido.',
        buttons: ['OK'],
      })
      return
    }

    if (!password) {
      await presentAlert({
        header: 'Campo obrigatorio',
        message: 'Informe sua senha.',
        buttons: ['OK'],
      })
      return
    }

    // Login
    setSubmitting(true)
    try {
      await login({ email: email.trim(), password })
      history.replace('/dashboard')
    } catch (err: unknown) {
      await presentAlert({
        header: 'Erro de login',
        message: getErrorMessage(err),
        buttons: ['OK'],
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Se já autenticado, não renderiza nada
  if (isAuthenticated) {
    return null
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <IonPage>
      <IonContent fullscreen>
        <NetworkStatusBanner />

        <div
          style={{
            maxWidth: 400,
            margin: 'auto',
            padding: '48px 24px',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* Logo / Título */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div
              style={{
                width: 80,
                height: 80,
                background: 'var(--ion-color-primary)',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <span style={{ fontSize: 40, color: 'white' }}>G</span>
            </div>
            <IonText color="dark">
              <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 700 }}>Gas Driver</h1>
            </IonText>
            <p style={{ margin: 0, color: 'var(--ion-color-medium)', fontSize: 15 }}>
              Entre com suas credenciais
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit}>
            <IonList lines="none" style={{ background: 'transparent' }}>
              <IonItem
                style={{
                  '--background': 'var(--ion-color-light)',
                  '--border-radius': '8px',
                  marginBottom: 12,
                }}
              >
                <IonLabel position="stacked" style={{ marginBottom: 4 }}>
                  E-mail
                </IonLabel>
                <IonInput
                  ref={emailInputRef}
                  type="email"
                  value={email}
                  onIonInput={(e) => handleEmailChange(String(e.detail.value || ''))}
                  placeholder="seu@email.com"
                  autocomplete="email"
                  inputmode="email"
                  enterkeyhint="next"
                  disabled={submitting}
                  style={{ '--padding-start': '0' }}
                />
              </IonItem>

              {emailError && (
                <p style={{ color: 'var(--ion-color-danger)', fontSize: 12, margin: '-8px 0 12px 4px' }}>
                  {emailError}
                </p>
              )}

              <IonItem
                style={{
                  '--background': 'var(--ion-color-light)',
                  '--border-radius': '8px',
                  marginBottom: 24,
                }}
              >
                <IonLabel position="stacked" style={{ marginBottom: 4 }}>
                  Senha
                </IonLabel>
                <IonInput
                  type="password"
                  value={password}
                  onIonInput={(e) => setPassword(String(e.detail.value || ''))}
                  placeholder="Sua senha"
                  autocomplete="current-password"
                  enterkeyhint="go"
                  disabled={submitting}
                  style={{ '--padding-start': '0' }}
                />
              </IonItem>
            </IonList>

            <IonButton
              type="submit"
              expand="block"
              disabled={submitting || isLoading || !email || !password}
              style={{
                '--border-radius': '8px',
                height: 50,
                fontWeight: 600,
              }}
            >
              {submitting ? (
                <IonSpinner name="crescent" style={{ width: 20, height: 20 }} />
              ) : (
                'Entrar'
              )}
            </IonButton>
          </form>

          {/* Footer */}
          <p
            style={{
              textAlign: 'center',
              marginTop: 32,
              fontSize: 12,
              color: 'var(--ion-color-medium)',
            }}
          >
            Gas Automation - Driver v1.0
          </p>
        </div>
      </IonContent>
    </IonPage>
  )
}
