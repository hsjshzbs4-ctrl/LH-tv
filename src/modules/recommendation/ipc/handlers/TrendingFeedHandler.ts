// modules/recommendation/ipc/handlers/TrendingFeedHandler.ts — CE9-E

import type { GenerateFeedResponse } from '../contracts/RecommendationIPCContracts'
import { toSafeError } from '../errors/IPCErrors'
import type { GetTrendingFeedUseCase } from '../../application/use-cases/GetTrendingFeedUseCase'

export class TrendingFeedHandler {
  constructor(private useCase: GetTrendingFeedUseCase) {}

  async handle(userId: string, experimentId: string, variantId: string, limit: number): Promise<GenerateFeedResponse> {
    try {
      const r = await this.useCase.execute(userId, experimentId, variantId, limit)
      return { version: 1, requestId: `trending_${userId}`, feed: r.feed, generatedAt: r.generatedAt, duration: r.duration, cacheHit: r.cacheHit }
    } catch (err) { throw toSafeError(err) }
  }
}
