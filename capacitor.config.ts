/**
 * Capacitor Configuration
 *
 * IMPORTANTE: Ajustar configurações para produção antes do build final.
 * Ver comentários inline para cada setting.
 */

import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Detecta ambiente de build
 * Em produção: npm run build -- --mode production
 */
const isProduction = process.env.NODE_ENV === 'production'

const config: CapacitorConfig = {
  appId: 'com.gasautomation.driver',
  appName: 'Gas Driver',
  webDir: 'dist',
  bundledWebRuntime: false,

  android: {
    /**
     * SEGURANCA: Permitir mixed content (HTTP + HTTPS)
     * - Desenvolvimento: true (para testes locais)
     * - Producao: false (apenas HTTPS)
     */
    allowMixedContent: !isProduction,

    /**
     * Captura de input (necessario para formularios)
     */
    captureInput: true,

    /**
     * SEGURANCA: Debug remoto do WebView
     * - Desenvolvimento: true (para debugging)
     * - Producao: false (NUNCA habilitar em producao!)
     */
    webContentsDebuggingEnabled: !isProduction,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0F172A',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#10B981',
    },

    /**
     * Preferences Plugin (storage seguro)
     */
    Preferences: {
      // Usa SharedPreferences criptografado no Android
    },
  },

  server: {
    /**
     * SEGURANCA: Permitir HTTP (cleartext)
     * - Desenvolvimento: true (para backend local)
     * - Producao: false (apenas HTTPS)
     */
    cleartext: !isProduction,

    /**
     * Scheme para Android
     * Sempre usar HTTPS para melhor compatibilidade
     */
    androidScheme: 'https',

    /**
     * Navegacao permitida
     * Em producao, restringir ao dominio do backend
     */
    allowNavigation: isProduction
      ? ['api.gasautomation.com']
      : ['192.168.10.156', 'localhost', 'http://192.168.10.156:8000'],
  },
}

export default config
