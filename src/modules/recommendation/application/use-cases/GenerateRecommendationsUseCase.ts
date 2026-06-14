// modules/recommendation/application/use-cases/GenerateRecommendationsUseCase.ts — CE9-B
// Generic recommendation entry point. Delegates to orchestrator.
// Stateless. No business logic.

import type { RecommendationRequestDto } from '../dto/RecommendationRequestDto'
import type { RecommendationResponseDto } from '../dto/RecommendationResponseDto'
import type { RecommendationOrchestrator } from '../orchestrators/RecommendationOrchestrator'

export class GenerateRecommendationsUseCase {
  constructor(private orchestrator: RecommendationOrchestrator) {}

  /** Execute generic recommendation request. Delegates everything to orchestrator. */
  async execute(request: RecommendationRequestDto): Promise<RecommendationResponseDto> {
    return this.orchestrator.execute(request)
  }
}
