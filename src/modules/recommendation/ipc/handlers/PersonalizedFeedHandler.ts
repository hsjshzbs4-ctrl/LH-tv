// modules/recommendation/ipc/handlers/PersonalizedFeedHandler.ts — CE9-E

import type { GenerateFeedResponse } from '../contracts/RecommendationIPCContracts'
import { toSafeError } from '../errors/IPCErrors'
import type { GetPersonalizedFeedUseCase } from '../../application/use-cases/GetPersonalizedFeedUseCase'

export class PersonalizedFeedHandler {
  constructor(private useCase: GetPersonalizedFeedUseCase) {}

  async handle(userId: string, experimentId: string, variantId: string, limit: number): Promise<GenerateFeedResponse> {
    try {
      const response = await this.useCase.execute(userId, experimentId, variantId, limit)
      return { version: 1, requestId: `personalized_${userId}`, feed: response.feed, generatedAt: response.generatedAt, duration: response.duration, cacheHit: response.cacheHit }
    } catch (err) { throw toSafeError(err) }
  }
}
