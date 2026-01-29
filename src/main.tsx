import React from 'react'
import ReactDOM from 'react-dom/client'
import { IonApp, setupIonicReact } from '@ionic/react'
import App from './App'
import './theme/variables.css'

setupIonicReact()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <IonApp>
      <App />
    </IonApp>
  </React.StrictMode>
)
