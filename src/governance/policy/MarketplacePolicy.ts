// src/governance/policy/MarketplacePolicy.ts — Marketplace 策略适配

import { marketplaceRegistry } from '@ecosystem/index'

export class MarketplacePolicy {
  static getStats() {
    return marketplaceRegistry.stats()
  }

  static getExtension(id: string) {
    return marketplaceRegistry.get(id)
  }
}
