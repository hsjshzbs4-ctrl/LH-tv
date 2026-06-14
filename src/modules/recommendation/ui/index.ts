// modules/recommendation/ui/index.ts — CE9-F Barrel Export

export { useRecommendationStore } from './stores/recommendation.store'
export type { UIRecommendationItem, UIFeed, UIFeedSection, UIRecommendationState, UIMetrics, LoadingState } from './types/recommendation-ui.types'
export { SECTION_TITLES, CARD_SIZES, LOADING_CONFIG, RAIL_CONFIG } from './constants/recommendation-ui.constants'
export type { IRecommendationTransport } from './services/recommendationService'
export { RecommendationService } from './services/recommendationService'
export { useRecommendations } from './composables/useRecommendations'
export { useRecommendationTracking } from './composables/useRecommendationTracking'
export { useRecommendationNavigation } from './composables/useRecommendationNavigation'
export { useRecommendationHero } from './composables/useRecommendationHero'

export { RecommendationHomePage } from './pages/RecommendationHomePage'
export { RecommendationHero } from './hero/RecommendationHero'
export { RecommendationRail, ContinueWatchingRail, TrendingRail, SimilarToLastWatchedRail } from './rails/RecommendationRail'
export { RecommendationCard, RecommendationReasonBadge, RecommendationCardPreview } from './cards/RecommendationCard'
export { RecommendationSkeleton, RailSkeleton, HeroSkeleton } from './skeletons/RecommendationSkeleton'
export { RecommendationErrorState } from './error/RecommendationErrorState'
export { RecommendationDetailDialog } from './dialogs/RecommendationDetailDialog'
