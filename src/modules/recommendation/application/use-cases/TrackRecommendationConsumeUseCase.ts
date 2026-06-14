// modules/recommendation/application/use-cases/TrackRecommendationConsumeUseCase.ts — CE9-B
// Records consumption analytics (play, favorite, dismiss, hide, complete).
// Fire-and-forget. No return value.
// Stateless. No business logic.

import type { IRecommendationAnalyticsPort } from '../ports/IRecommendationAnalyticsPort'
import { TrackingFailedError } from '../errors/RecommendationErrors'

export type ConsumeAction = 'play' | 'favorite' | 'dismiss' | 'hide' | 'watch-complete'

export interface ConsumeParams {
  readonly feedId: string
  readonly mediaId: string
  readonly action: ConsumeAction
  readonly sectionId?: string
  readonly sourceId?: string
  readonly position?: number
  readonly dismissReason?: 'not-interested' | 'already-watched' | 'dislike' | 'other'
  readonly watchedDuration?: number
  readonly totalDuration?: number
}

export class TrackRecommendationConsumeUseCase {
  constructor(private analyticsPort: IRecommendationAnalyticsPort) {}

  /** Record a consumption event. Errors are caught and re-thrown as typed errors. */
  async execute(params: ConsumeParams): Promise<void> {
    try {
      switch (params.action) {
        case 'play':
          await this.analyticsPort.recordPlay(
            params.feedId,
            params.mediaId,
            params.sourceId ?? 'unknown',
          )
          break
        case 'favorite':
          await this.analyticsPort.recordFavorite(params.feedId, params.mediaId)
          break
        case 'dismiss':
          await this.analyticsPort.recordDismiss(
            params.feedId,
            params.sectionId ?? 'unknown',
            params.mediaId,
            params.dismissReason ?? 'other',
          )
          break
        case 'hide':
          await this.analyticsPort.recordHide(
            params.feedId,
            params.sectionId ?? 'unknown',
          )
          break
        case 'watch-complete':
          await this.analyticsPort.recordWatchComplete(
            params.feedId,
            params.mediaId,
            params.watchedDuration ?? 0,
            params.totalDuration ?? 0,
          )
          break
      }
    } catch (err) {
      throw new TrackingFailedError(params.action, String(err))
    }
  }
}
