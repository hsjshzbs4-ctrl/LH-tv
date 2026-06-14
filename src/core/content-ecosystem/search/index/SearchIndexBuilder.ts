// core/content-ecosystem/search/index/SearchIndexBuilder.ts — CE7.4 Index builder
// Gathers SearchDocument[] from all registered ISearchDataSource[] and passes
// them to the SearchIndexRepository for storage.
//
// Decoupled from concrete Facades — depends only on ISearchDataSource interface.
// New data sources (CE10+ third-party) are added by implementing the interface.

import type { ISearchDataSource } from '../contracts/ISearchDataSource'
import type { SearchDocument } from '../contracts/search.types'

export class SearchIndexBuilder {
  constructor(private dataSources: ISearchDataSource[]) {}

  /**
   * Rebuild the entire index from all available data sources.
   * Runs all sources in parallel via Promise.allSettled for resilience.
   * Returns the complete set of documents.
   */
  async rebuildAll(): Promise<SearchDocument[]> {
    const availableSources = this.dataSources.filter(ds => ds.isAvailable())

    const results = await Promise.allSettled(
      availableSources.map(ds => ds.getDocuments()),
    )

    const allDocs: SearchDocument[] = []
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allDocs.push(...result.value)
      }
      // Rejected sources are silently skipped — partial index is better than none
    }

    return allDocs
  }

  /**
   * Get documents from a specific source by sourceId.
   */
  async buildFromSource(sourceId: string): Promise<SearchDocument[]> {
    const source = this.dataSources.find(ds => ds.sourceId === sourceId)
    if (!source || !source.isAvailable()) return []
    return source.getDocuments()
  }
}
