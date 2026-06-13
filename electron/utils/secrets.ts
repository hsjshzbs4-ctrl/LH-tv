// electron/utils/secrets.ts - safeStorage 加密
import { safeStorage } from 'electron'

export function encrypt(text: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    return Buffer.from(text, 'utf-8').toString('base64')
  }
  const encrypted = safeStorage.encryptString(text)
  return encrypted.toString('base64')
}

export function decrypt(encoded: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    return Buffer.from(encoded, 'base64').toString('utf-8')
  }
  const buffer = Buffer.from(encoded, 'base64')
  return safeStorage.decryptString(buffer)
}
