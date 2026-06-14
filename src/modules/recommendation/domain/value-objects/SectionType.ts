// modules/recommendation/domain/value-objects/SectionType.ts — CE9-A
// Feed section type enum. 7 independent section types (Req 11).

/**
 * Each recommendation feed consists of independent sections.
 * Every section has a distinct type that determines its display and behavior.
 */
export type SectionType =
  | 'continue-watching'
  | 'trending'
  | 'because-you-watched'
  | 'recently-added'
  | 'popular'
  | 'for-you'
  | 'similar-content'

/** Ordered list of all section types for feed assembly */
export const SECTION_TYPE_ORDER: readonly SectionType[] = [
  'continue-watching',
  'because-you-watched',
  'for-you',
  'trending',
  'popular',
  'recently-added',
  'similar-content',
] as const

/** Human-readable labels for each section type */
export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  'continue-watching': 'Continue Watching',
  'trending': 'Trending',
  'because-you-watched': 'Because You Watched',
  'recently-added': 'Recently Added',
  'popular': 'Popular',
  'for-you': 'For You',
  'similar-content': 'Similar Content',
}

/** Get the display order of a section type (lower = shown first) */
export function sectionDisplayOrder(type: SectionType): number {
  return SECTION_TYPE_ORDER.indexOf(type)
}
