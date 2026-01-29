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
import { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const history = useHistory()
  const { login, isAuthenticated, isLoading } = useAuth()
  const [presentAlert] = useIonAlert()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    history.replace('/dashboard')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      await presentAlert({
        header: 'Campos obrigatórios',
        message: 'Preencha e-mail e senha.',
        buttons: ['OK'],
      })
      return
    }
    setSubmitting(true)
    try {
      await login({ email: email.trim(), password })
      history.replace('/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login. Tente novamente.'
      await presentAlert({
        header: 'Erro de login',
        message,
        buttons: ['OK'],
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        <div style={{ maxWidth: 400, margin: 'auto', paddingTop: 48 }}>
          <IonText color="primary">
            <h1 style={{ textAlign: 'center', marginBottom: 8 }}>Gas Driver</h1>
          </IonText>
          <p style={{ textAlign: 'center', color: 'var(--ion-color-medium)', marginBottom: 32 }}>
            Entre com suas credenciais de entregador
          </p>
          <form onSubmit={handleSubmit}>
            <IonList lines="none" className="ion-no-padding">
              <IonItem>
                <IonLabel position="stacked">E-mail</IonLabel>
                <IonInput
                  type="email"
                  value={email}
                  onIonInput={(e) => setEmail(String((e.target as unknown as { value?: string }).value ?? ''))}
                  placeholder="seu@email.com"
                  autocomplete="email"
                  required
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Senha</IonLabel>
                <IonInput
                  type="password"
                  value={password}
                  onIonInput={(e) => setPassword(String((e.target as unknown as { value?: string }).value ?? ''))}
                  placeholder="••••••••"
                  autocomplete="current-password"
                  required
                />
              </IonItem>
            </IonList>
            <IonButton
              type="submit"
              expand="block"
              disabled={submitting || isLoading}
              style={{ marginTop: 24 }}
            >
              {submitting ? <IonSpinner name="crescent" /> : 'Entrar'}
            </IonButton>
          </form>
        </div>
      </IonContent>
    </IonPage>
  )
}
