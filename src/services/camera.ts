/**
 * Camera Service
 *
 * Captura foto de comprovante de entrega.
 * Upload para o backend (MinIO storage).
 */

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { api } from './api'

export interface PhotoResult {
  base64: string
  format: string
}

/**
 * Tira foto usando a câmera ou galeria
 */
export async function takeDeliveryPhoto(): Promise<PhotoResult | null> {
  try {
    const photo = await Camera.getPhoto({
      quality: 70,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Prompt, // Pergunta: câmera ou galeria
      width: 1280,
      height: 960,
      correctOrientation: true,
    })

    if (!photo.base64String) return null

    return {
      base64: photo.base64String,
      format: photo.format || 'jpeg',
    }
  } catch {
    // Usuário cancelou ou permissão negada
    return null
  }
}

/**
 * Upload da foto de comprovante para o backend
 */
export async function uploadDeliveryProof(
  deliveryId: string,
  photo: PhotoResult
): Promise<string> {
  // Converte base64 para blob
  const byteChars = atob(photo.base64)
  const byteNumbers = new Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], { type: `image/${photo.format}` })

  const formData = new FormData()
  formData.append('file', blob, `proof_${deliveryId}_${Date.now()}.${photo.format}`)

  const { data } = await api.post('/images/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000, // 30s para upload de foto
  })

  return data.url || data.filename || data.id
}
