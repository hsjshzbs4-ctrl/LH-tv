// modules/recommendation/ui/services/recommendationService.ts — CE9-F
// Abstraction layer between UI and IPC. Allows testing without Electron.

import type { UIFeed, UIFeedSection, UIRecommendationItem } from '../types/recommendation-ui.types'

export interface IRecommendationTransport {
  invoke(channel: string, ...args: unknown[]): Promise<unknown>
  on(channel: string, handler: (...args: unknown[]) => void): void
}

export class RecommendationService {
  constructor(private transport: IRecommendationTransport) {}

  async loadPersonalizedFeed(userId: string, experimentId: string, variantId: string): Promise<UIFeed> {
    return this.transport.invoke('recommendation:personalized', userId, experimentId, variantId, 20) as Promise<UIFeed>
  }

  async loadTrendingFeed(userId: string, experimentId: string, variantId: string): Promise<UIFeed> {
    return this.transport.invoke('recommendation:trending', userId, experimentId, variantId, 20) as Promise<UIFeed>
  }

  async loadContinueWatching(userId: string, experimentId: string, variantId: string): Promise<UIFeed> {
    return this.transport.invoke('recommendation:continueWatching', userId, experimentId, variantId, 10) as Promise<UIFeed>
  }

  async loadSimilarContent(userId: string, mediaId: string, experimentId: string, variantId: string): Promise<UIFeed> {
    return this.transport.invoke('recommendation:similar', userId, mediaId, experimentId, variantId, 10) as Promise<UIFeed>
  }

  async trackClick(feedId: string, sectionId: string, mediaId: string, position: number): Promise<void> {
    await this.transport.invoke('recommendation:trackClick', feedId, sectionId, mediaId, position)
  }

  async trackConsume(feedId: string, mediaId: string, action: string): Promise<void> {
    await this.transport.invoke('recommendation:trackConsume', feedId, mediaId, action)
  }

  async getHealth(): Promise<{ status: string }> {
    return this.transport.invoke('recommendation:health') as Promise<{ status: string }>
  }
}
