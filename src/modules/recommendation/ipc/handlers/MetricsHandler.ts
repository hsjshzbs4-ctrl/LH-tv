// modules/recommendation/ipc/handlers/MetricsHandler.ts — CE9-E

import type { MetricsResponse } from '../contracts/RecommendationIPCContracts'

export class MetricsHandler {
  async handle(): Promise<MetricsResponse> {
    return {
      version: 1,
      requestsTotal: 0,
      cacheHitRatio: 0,
      avgGenerationTimeMs: 0,
      providers: [],
    }
  }
}
