// src/plugin-marketplace/signatures/SignatureStore.ts — 签名存储
// P5.1 Plugin Marketplace Core
import type { PluginSignature } from './types'

export class SignatureStore {
  private signatures = new Map<string, PluginSignature>()

  store(pluginId: string, signature: PluginSignature): void {
    this.signatures.set(pluginId, signature)
  }

  get(pluginId: string): PluginSignature | undefined {
    return this.signatures.get(pluginId)
  }

  remove(pluginId: string): void {
    this.signatures.delete(pluginId)
  }

  getAll(): Map<string, PluginSignature> {
    return new Map(this.signatures)
  }
}

export const signatureStore = new SignatureStore()
