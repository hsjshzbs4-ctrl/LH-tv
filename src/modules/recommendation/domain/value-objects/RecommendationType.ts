// modules/recommendation/domain/value-objects/RecommendationType.ts — CE9-A
// Enum of recommendation generation types.

export type RecommendationType =
  | 'personalized'
  | 'trending'
  | 'continue-watching'
  | 'similar'
  | 'popular'
  | 'provider-pick'
  | 'hybrid'

export const RECOMMENDATION_TYPE_LABELS: Record<RecommendationType, string> = {
  'personalized': 'Personalized',
  'trending': 'Trending',
  'continue-watching': 'Continue Watching',
  'similar': 'Similar Content',
  'popular': 'Popular',
  'provider-pick': 'Provider Pick',
  'hybrid': 'Hybrid',
}
