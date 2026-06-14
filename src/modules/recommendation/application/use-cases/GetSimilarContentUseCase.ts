// modules/recommendation/application/use-cases/GetSimilarContentUseCase.ts — CE9-B
// Produces "Similar Content" feed for a specific media item.
// Stateless. No business logic. Delegates to orchestrator.

import type { RecommendationRequestDto } from '../dto/RecommendationRequestDto'
import type { RecommendationResponseDto } from '../dto/RecommendationResponseDto'
import type { RecommendationOrchestrator } from '../orchestrators/RecommendationOrchestrator'

export class GetSimilarContentUseCase {
  constructor(private orchestrator: RecommendationOrchestrator) {}

  async execute(
    userId: string,
    mediaId: string,
    experimentId: string,
    variantId: string,
    limit: number = 10,
  ): Promise<RecommendationResponseDto> {
    const request: RecommendationRequestDto = {
      requestId: `similar_${mediaId}_${Date.now()}`,
      userId,
      experimentId,
      variantId,
      timestamp: Date.now(),
      feedType: 'similar-content',
      limit,
      offset: 0,
      metadata: { sourceMediaId: mediaId },
    }
    return this.orchestrator.execute(request)
  }
}
