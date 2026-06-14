// modules/recommendation/application/ports/IRecommendationAnalyticsPort.ts — CE9-B
// Analytics recording port. Tracks all 7 recommendation interaction types (Req 9).

export interface IRecommendationAnalyticsPort {
  /** Track when recommendations are displayed to the user */
  recordImpression(feedId: string, sectionId: string, items: string[]): Promise<void>

  /** Track when user clicks a recommendation */
  recordClick(feedId: string, sectionId: string, mediaId: string, position: number): Promise<void>

  /** Track when user plays recommended content */
  recordPlay(feedId: string, mediaId: string, sourceId: string): Promise<void>

  /** Track when user favorites recommended content */
  recordFavorite(feedId: string, mediaId: string): Promise<void>

  /** Track when user dismisses a recommendation */
  recordDismiss(
    feedId: string,
    sectionId: string,
    mediaId: string,
    reason: 'not-interested' | 'already-watched' | 'dislike' | 'other',
  ): Promise<void>

  /** Track when user hides an entire section */
  recordHide(feedId: string, sectionId: string): Promise<void>

  /** Track when user completes watching recommended content */
  recordWatchComplete(
    feedId: string,
    mediaId: string,
    watchedDuration: number,
    totalDuration: number,
  ): Promise<void>
}
