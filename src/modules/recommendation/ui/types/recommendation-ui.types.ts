// modules/recommendation/ui/types/recommendation-ui.types.ts — CE9-F

export interface UIFeedSection {
  readonly id: string
  readonly type: string
  readonly title: string
  readonly subtitle?: string
  readonly items: UIRecommendationItem[]
  readonly displayOrder: number
}

export interface UIRecommendationItem {
  readonly mediaId: string
  readonly title: string
  readonly cover: string
  readonly backdrop?: string
  readonly type: 'movie' | 'tv' | 'anime'
  readonly year?: number
  readonly score: number
  readonly reason: string
  readonly genres?: string[]
  readonly rating?: number
  readonly progress?: number
  readonly duration?: number
  readonly availableOn?: string[]
}

export interface UIFeed {
  readonly feedId: string
  readonly sections: UIFeedSection[]
  readonly generatedAt: number
  readonly ttl: number
  readonly cacheHit: boolean
}

export type LoadingState = 'idle' | 'loading' | 'loaded' | 'error' | 'refreshing'

export interface UIRecommendationState {
  readonly feeds: Record<string, UIFeed>
  readonly loadingState: LoadingState
  readonly error: string | null
  readonly heroContent: UIRecommendationItem | null
  readonly selectedItem: UIRecommendationItem | null
  readonly metrics: UIMetrics
}

export interface UIMetrics {
  readonly impressions: number
  readonly clicks: number
  readonly plays: number
}
