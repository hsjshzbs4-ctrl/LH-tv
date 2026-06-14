// modules/search-unified/domain/contracts/IResultMerger.ts — CE8-A
// Contract for merging raw search documents into unified results.

import type { SearchDocument } from './ISearchProvider'
import type { UnifiedSearchResult } from '../entities/UnifiedSearchResult'

export interface IResultMerger {
  /** Merge raw documents from multiple providers into deduplicated unified results. */
  merge(documents: SearchDocument[]): UnifiedSearchResult[]
}
