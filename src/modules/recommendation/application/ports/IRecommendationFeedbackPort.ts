// modules/recommendation/application/ports/IRecommendationFeedbackPort.ts — CE9-B
// Feedback collection port. Records user feedback on recommendations.

export interface IRecommendationFeedbackPort {
  /** Record that a user dismissed a specific recommendation */
  dismissItem(feedId: string, mediaId: string, reason: string): Promise<void>

  /** Record that a user hid a section */
  hideSection(feedId: string, sectionId: string): Promise<void>

  /** Store generic feedback event */
  storeFeedback(
    feedId: string,
    mediaId: string,
    action: string,
    metadata?: Record<string, unknown>,
  ): Promise<void>
}
