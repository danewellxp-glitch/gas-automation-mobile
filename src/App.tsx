import React from 'react'
import { IonRouterOutlet } from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { Redirect, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DeliveryList from './pages/DeliveryList'
import DeliveryDetail from './pages/DeliveryDetail'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  if (!isAuthenticated) return <Redirect to="/login" />
  return <>{children}</>
}

const IonRouter = IonReactRouter as React.ComponentType<{ children?: React.ReactNode }>

function AppRoutes() {
  return (
    <IonRouter>
      <IonRouterOutlet>
        <Route path="/login" exact>
          <Login />
        </Route>
        <Route path="/dashboard" exact>
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        </Route>
        <Route path="/deliveries" exact>
          <PrivateRoute>
            <DeliveryList />
          </PrivateRoute>
        </Route>
        <Route path="/delivery/:id" exact>
          <PrivateRoute>
            <DeliveryDetail />
          </PrivateRoute>
        </Route>
        <Route path="/" exact>
          <Redirect to="/dashboard" />
        </Route>
        <Route path="*">
          <Redirect to="/dashboard" />
        </Route>
      </IonRouterOutlet>
    </IonRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
