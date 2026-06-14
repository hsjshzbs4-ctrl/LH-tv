// modules/search-unified/application/ports/ISearchSuggestionPort.ts — CE8-B
// Application port for search suggestions / autocomplete.
// CE8-C infrastructure adapter implements this interface.

export interface ISearchSuggestionPort {
  /** Generate autocomplete suggestions for a partial query. */
  suggest(query: string, limit?: number): Promise<string[]>
}
