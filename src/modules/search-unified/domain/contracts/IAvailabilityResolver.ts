// modules/search-unified/domain/contracts/IAvailabilityResolver.ts — CE8-A
// Contract for resolving playability and preferred source for a search result.

import type { UnifiedSearchResult, UnifiedSearchResultProps } from '../entities/UnifiedSearchResult'
import type { AvailabilityInfo } from '../entities/AvailabilityInfo'

export interface IAvailabilityResolver {
  /** Resolve availability for a single unified result. */
  resolve(result: UnifiedSearchResult): AvailabilityInfo
}
