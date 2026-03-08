/**
 * App Root Component
 *
 * Configuração de rotas, providers e error boundary.
 * Lazy loading de páginas para melhor performance.
 */

import React, { Suspense, lazy } from 'react'
import { IonRouterOutlet, IonSpinner } from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { Redirect, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'

// ============================================================================
// LAZY LOADING
// ============================================================================

/**
 * Páginas carregadas sob demanda
 * Reduz bundle inicial e melhora tempo de carregamento
 */
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const DeliveryList = lazy(() => import('./pages/DeliveryList'))
const DeliveryDetail = lazy(() => import('./pages/DeliveryDetail'))
const DeliveryHistory = lazy(() => import('./pages/DeliveryHistory'))

// ============================================================================
// LOADING FALLBACK
// ============================================================================

/**
 * Componente de loading durante lazy load
 */
function PageLoading() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--ion-background-color)',
      }}
    >
      <IonSpinner name="crescent" color="primary" />
    </div>
  )
}

// ============================================================================
// ROUTE GUARD
// ============================================================================

/**
 * Componente de rota protegida
 * Redireciona para login se não autenticado
 */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <PageLoading />
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />
  }

  return <>{children}</>
}

// ============================================================================
// ROUTER
// ============================================================================

/**
 * Workaround para tipagem do IonReactRouter
 */
const IonRouter = IonReactRouter as React.ComponentType<{ children?: React.ReactNode }>

/**
 * Configuração de rotas do app
 */
function AppRoutes() {
  return (
    <IonRouter>
      <IonRouterOutlet>
        {/* Rota pública */}
        <Route path="/login" exact>
          <Suspense fallback={<PageLoading />}>
            <Login />
          </Suspense>
        </Route>

        {/* Rotas protegidas */}
        <Route path="/dashboard" exact>
          <PrivateRoute>
            <Suspense fallback={<PageLoading />}>
              <Dashboard />
            </Suspense>
          </PrivateRoute>
        </Route>

        <Route path="/deliveries/history" exact>
          <PrivateRoute>
            <Suspense fallback={<PageLoading />}>
              <DeliveryHistory />
            </Suspense>
          </PrivateRoute>
        </Route>

        <Route path="/deliveries" exact>
          <PrivateRoute>
            <Suspense fallback={<PageLoading />}>
              <DeliveryList />
            </Suspense>
          </PrivateRoute>
        </Route>

        <Route path="/delivery/:id" exact>
          <PrivateRoute>
            <Suspense fallback={<PageLoading />}>
              <DeliveryDetail />
            </Suspense>
          </PrivateRoute>
        </Route>

        {/* Redirect raiz para login (PrivateRoute redireciona de volta se necessário) */}
        <Route path="/" exact>
          <Redirect to="/login" />
        </Route>
      </IonRouterOutlet>
    </IonRouter>
  )
}

// ============================================================================
// APP
// ============================================================================

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  )
}
