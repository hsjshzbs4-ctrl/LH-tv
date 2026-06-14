// modules/recommendation/application/use-cases/TrackRecommendationClickUseCase.ts — CE9-B
// Records click analytics. Fire-and-forget. No return value.
// Stateless. No business logic.

import type { IRecommendationAnalyticsPort } from '../ports/IRecommendationAnalyticsPort'
import { TrackingFailedError } from '../errors/RecommendationErrors'

export class TrackRecommendationClickUseCase {
  constructor(private analyticsPort: IRecommendationAnalyticsPort) {}

  /** Record a recommendation click. Errors are caught and re-thrown as typed errors. */
  async execute(
    feedId: string,
    sectionId: string,
    mediaId: string,
    position: number,
  ): Promise<void> {
    try {
      await this.analyticsPort.recordClick(feedId, sectionId, mediaId, position)
    } catch (err) {
      throw new TrackingFailedError('click', String(err))
    }
  }
}
