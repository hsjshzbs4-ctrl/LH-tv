// modules/recommendation/application/use-cases/GetContinueWatchingUseCase.ts — CE9-B
// Produces "Continue Watching" feed.
// Stateless. No business logic. Delegates to orchestrator.

import type { RecommendationRequestDto } from '../dto/RecommendationRequestDto'
import type { RecommendationResponseDto } from '../dto/RecommendationResponseDto'
import type { RecommendationOrchestrator } from '../orchestrators/RecommendationOrchestrator'

export class GetContinueWatchingUseCase {
  constructor(private orchestrator: RecommendationOrchestrator) {}

  async execute(userId: string, experimentId: string, variantId: string, limit: number = 10): Promise<RecommendationResponseDto> {
    const request: RecommendationRequestDto = {
      requestId: `continue_watching_${userId}_${Date.now()}`,
      userId,
      experimentId,
      variantId,
      timestamp: Date.now(),
      feedType: 'continue-watching',
      limit,
      offset: 0,
    }
    return this.orchestrator.execute(request)
  }
}
