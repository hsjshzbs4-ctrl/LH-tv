// modules/recommendation/infrastructure/serialization/FeedSerializer.ts — CE9-D
// JSON serialization for RecommendationFeed. Design for future binary/compressed formats.

import type { RecommendationFeed } from '../../domain/entities/RecommendationFeed'

export class FeedSerializer {
  serialize(feed: RecommendationFeed): string {
    return JSON.stringify({
      v: 1,
      feedId: feed.feedId,
      generatedAt: feed.generatedAt,
      ttl: feed.ttl,
      context: {
        userId: feed.context.userId,
        experimentId: feed.context.experimentId,
        variantId: feed.context.variantId,
        sessionId: feed.context.sessionId,
        timestamp: feed.context.timestamp,
      },
      sections: feed.sections.map(s => ({
        id: s.id, type: s.type, title: s.title, subtitle: s.subtitle,
        items: s.items.map(i => ({
          mediaId: i.mediaId, title: i.title, cover: i.cover, type: i.type,
          year: i.year, score: i.score.composite, reason: i.reason.rendered,
          genres: i.genres, rating: i.rating, progress: i.progress,
        })),
        source: { type: s.source.sourceType, label: s.source.label, weight: s.source.weight },
      })),
      metadata: feed.metadata,
    })
  }

  deserialize(json: string): RecommendationFeed | null {
    try {
      const data = JSON.parse(json)
      // Minimal validation
      if (!data.feedId || !data.sections) return null
      // Return as plain object — actual entity reconstruction via mapper
      return data as unknown as RecommendationFeed
    } catch {
      return null
    }
  }
}
