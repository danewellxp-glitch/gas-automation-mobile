/**
 * Navigation Utils
 *
 * Deep links para Waze e Google Maps.
 * Abre navegação direta ao endereço da entrega.
 */

/**
 * Abre navegação no Waze ou Google Maps
 * Tenta Waze primeiro, fallback para Google Maps
 */
export function openNavigation(address: string): void {
  const encoded = encodeURIComponent(address)
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`
  const isAndroid = /android/i.test(navigator.userAgent)

  if (isAndroid) {
    // Android: geo intent abre seletor de app (Waze, Google Maps, etc)
    try {
      window.open(`geo:0,0?q=${encoded}`, '_system')
    } catch {
      window.open(mapsUrl, '_blank')
    }
  } else {
    window.open(mapsUrl, '_blank')
  }
}

/**
 * Abre navegação especificamente no Waze
 */
export function openWaze(address: string): void {
  const encoded = encodeURIComponent(address)
  window.open(`https://waze.com/ul?q=${encoded}&navigate=yes`, '_blank')
}

/**
 * Abre navegação especificamente no Google Maps
 */
export function openGoogleMaps(address: string): void {
  const encoded = encodeURIComponent(address)
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank')
}

/**
 * Abre navegação com coordenadas (lat/lng)
 */
export function openNavigationByCoords(lat: number, lng: number): void {
  const isAndroid = /android/i.test(navigator.userAgent)

  if (isAndroid) {
    try {
      window.open(`geo:${lat},${lng}`, '_system')
    } catch {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
    }
  } else {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
  }
}
