// modules/recommendation/ipc/handlers/SimilarContentHandler.ts — CE9-E

import type { GenerateFeedResponse } from '../contracts/RecommendationIPCContracts'
import { toSafeError } from '../errors/IPCErrors'
import type { GetSimilarContentUseCase } from '../../application/use-cases/GetSimilarContentUseCase'

export class SimilarContentHandler {
  constructor(private useCase: GetSimilarContentUseCase) {}

  async handle(userId: string, mediaId: string, experimentId: string, variantId: string, limit: number): Promise<GenerateFeedResponse> {
    try {
      const r = await this.useCase.execute(userId, mediaId, experimentId, variantId, limit)
      return { version: 1, requestId: `similar_${mediaId}`, feed: r.feed, generatedAt: r.generatedAt, duration: r.duration, cacheHit: r.cacheHit }
    } catch (err) { throw toSafeError(err) }
  }
}
