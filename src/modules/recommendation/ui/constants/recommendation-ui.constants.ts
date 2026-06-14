// modules/recommendation/ui/constants/recommendation-ui.constants.ts — CE9-F

export const SECTION_TITLES: Record<string, string> = {
  'continue-watching': 'Continue Watching',
  'trending': 'Trending Now',
  'because-you-watched': 'Because You Watched',
  'recently-added': 'Recently Added',
  'popular': 'Popular on Your Services',
  'for-you': 'Recommended for You',
  'similar-content': 'Similar Content',
}

export const CARD_SIZES = {
  poster: { width: 200, height: 300 },
  backdrop: { width: 340, height: 190 },
  hero: { width: 1280, height: 720 },
} as const

export const LOADING_CONFIG = {
  skeletonCards: 6,
  skeletonRails: 3,
  retryDelayMs: 3000,
  maxRetries: 3,
} as const

export const RAIL_CONFIG = {
  itemsPerRail: 20,
  scrollStep: 400,
  hoverScale: 1.05,
  animationDurationMs: 200,
} as const
