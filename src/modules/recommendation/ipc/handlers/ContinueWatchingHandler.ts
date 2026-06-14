// modules/recommendation/ipc/handlers/ContinueWatchingHandler.ts — CE9-E

import type { GenerateFeedResponse } from '../contracts/RecommendationIPCContracts'
import { toSafeError } from '../errors/IPCErrors'
import type { GetContinueWatchingUseCase } from '../../application/use-cases/GetContinueWatchingUseCase'

export class ContinueWatchingHandler {
  constructor(private useCase: GetContinueWatchingUseCase) {}

  async handle(userId: string, experimentId: string, variantId: string, limit: number): Promise<GenerateFeedResponse> {
    try {
      const r = await this.useCase.execute(userId, experimentId, variantId, limit)
      return { version: 1, requestId: `continue_${userId}`, feed: r.feed, generatedAt: r.generatedAt, duration: r.duration, cacheHit: r.cacheHit }
    } catch (err) { throw toSafeError(err) }
  }
}
