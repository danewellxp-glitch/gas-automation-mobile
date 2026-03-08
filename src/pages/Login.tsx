/**
 * Login Page
 *
 * Tela de autenticação do motorista.
 * UX otimizada para entrada rápida.
 */

import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  useIonAlert,
} from '@ionic/react'
import { mailOutline, lockClosedOutline } from 'ionicons/icons'
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
  const { login, isAuthenticated, isLoading, setTruckPlate } = useAuth()
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

      // Solicita a placa do caminhão
      await new Promise<void>((resolve) => {
        presentAlert({
          header: 'Qual a placa do caminhao?',
          message: 'Informe a placa do veiculo que voce esta usando hoje.',
          inputs: [
            {
              name: 'plate',
              type: 'text',
              placeholder: 'Ex: ABC-1234',
              attributes: {
                maxlength: 10,
                autocapitalize: 'characters',
                autocorrect: 'off',
                spellcheck: false,
              },
            },
          ],
          buttons: [
            {
              text: 'Confirmar',
              handler: async (data) => {
                const plate = String(data.plate || '').trim().toUpperCase()
                if (plate) {
                  await setTruckPlate(plate)
                }
                resolve()
              },
            },
          ],
          backdropDismiss: false,
        })
      })

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
      <IonContent fullscreen className="login-content">
        <NetworkStatusBanner />

        {/* Background dark com elementos visuais */}
        <div className="login-bg">
          <div className="login-bg-shape login-bg-shape-1" />
          <div className="login-bg-shape login-bg-shape-2" />
          <div className="login-bg-shape login-bg-shape-3" />
        </div>

        <div className="login-container">
          <IonCard className="login-card">
            <IonCardContent>
              {/* Logo / Nome do App */}
              <div className="login-header">
                <div className="login-logo">
                  <span>G</span>
                </div>
                <h1 className="login-title">Gasmaster</h1>
                <p className="login-subtitle">Entre com suas credenciais</p>
              </div>

              {/* Formulário */}
              <form onSubmit={handleSubmit}>
                <IonList lines="none" className="login-form-list">
                  <IonItem className="login-input-item">
                    <IonIcon icon={mailOutline} slot="start" className="login-input-icon" />
                    <IonLabel position="stacked">E-mail</IonLabel>
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
                      className="login-input"
                    />
                  </IonItem>

                  {emailError && <p className="login-error">{emailError}</p>}

                  <IonItem className="login-input-item">
                    <IonIcon icon={lockClosedOutline} slot="start" className="login-input-icon" />
                    <IonLabel position="stacked">Senha</IonLabel>
                    <IonInput
                      type="password"
                      value={password}
                      onIonInput={(e) => setPassword(String(e.detail.value || ''))}
                      placeholder="Sua senha"
                      autocomplete="current-password"
                      autocapitalize="off"
                      autocorrect="off"
                      spellcheck={false}
                      enterkeyhint="go"
                      disabled={submitting}
                      className="login-input"
                    />
                  </IonItem>
                </IonList>

                <IonButton
                  type="submit"
                  expand="block"
                  disabled={submitting || isLoading || !email || !password}
                  className="login-button"
                >
                  {submitting ? (
                    <IonSpinner name="crescent" style={{ width: 24, height: 24 }} />
                  ) : (
                    'Entrar'
                  )}
                </IonButton>
              </form>
            </IonCardContent>
          </IonCard>

          <p className="login-footer">Gas Automation - Driver v1.0</p>
        </div>
      </IonContent>
    </IonPage>
  )
}
