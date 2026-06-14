// modules/search-unified/application/ports/ISearchProviderPort.ts — CE8-B
// Application port for search document providers.
// Application layer depends on this abstraction, not concrete providers.

import type { SearchQuery } from '../../domain/value-objects/SearchQuery'
import type { SearchDocument } from '../../domain/contracts/ISearchProvider'

export interface ISearchProviderPort {
  /** Execute a search against a single provider. */
  search(query: SearchQuery): Promise<SearchDocument[]>

  /** Provider unique identifier */
  readonly providerId: string

  /** Whether the provider is currently available */
  isAvailable(): boolean
}
