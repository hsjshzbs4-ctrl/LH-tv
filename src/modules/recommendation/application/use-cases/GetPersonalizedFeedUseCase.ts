// modules/recommendation/application/use-cases/GetPersonalizedFeedUseCase.ts — CE9-B
// Produces "For You" personalized feed.
// Stateless. No business logic. Delegates to orchestrator.

import type { RecommendationRequestDto } from '../dto/RecommendationRequestDto'
import type { RecommendationResponseDto } from '../dto/RecommendationResponseDto'
import type { RecommendationOrchestrator } from '../orchestrators/RecommendationOrchestrator'

export class GetPersonalizedFeedUseCase {
  constructor(private orchestrator: RecommendationOrchestrator) {}

  async execute(userId: string, experimentId: string, variantId: string, limit: number = 20): Promise<RecommendationResponseDto> {
    const request: RecommendationRequestDto = {
      requestId: `personalized_${userId}_${Date.now()}`,
      userId,
      experimentId,
      variantId,
      timestamp: Date.now(),
      feedType: 'personalized',
      limit,
      offset: 0,
    }
    return this.orchestrator.execute(request)
  }
}
