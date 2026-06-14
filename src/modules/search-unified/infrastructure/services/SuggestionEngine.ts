// modules/search-unified/infrastructure/services/SuggestionEngine.ts — CE8-C2
// Generates search suggestions from multiple sources: history, popular, provider.
// Deduplicates and limits to maxResults.

export interface SuggestionSource {
  /** Source identifier. */
  readonly sourceId: string
  /** Generate suggestions for a query. */
  suggest(query: string, limit: number): Promise<string[]>
}

export class SuggestionEngine {
  private sources: SuggestionSource[] = []
  private minQueryLength: number
  private maxResults: number

  constructor(minQueryLength = 2, maxResults = 10) {
    this.minQueryLength = minQueryLength
    this.maxResults = maxResults
  }

  /** Register a suggestion source. */
  registerSource(source: SuggestionSource): void {
    this.sources.push(source)
  }

  /** Remove a suggestion source. */
  unregisterSource(sourceId: string): void {
    this.sources = this.sources.filter(s => s.sourceId !== sourceId)
  }

  /**
   * Generate suggestions from all registered sources.
   * Deduplicates and limits to maxResults.
   */
  async suggest(query: string): Promise<string[]> {
    const trimmed = query.trim()
    if (trimmed.length < this.minQueryLength) return []

    // Fan-out to all sources
    const results = await Promise.allSettled(
      this.sources.map(s => s.suggest(trimmed, this.maxResults)),
    )

    // Collect and deduplicate
    const seen = new Set<string>()
    const suggestions: string[] = []

    for (const result of results) {
      if (result.status === 'fulfilled') {
        for (const suggestion of result.value) {
          const normalized = suggestion.trim()
          if (normalized && !seen.has(normalized)) {
            seen.add(normalized)
            suggestions.push(normalized)
          }
        }
      }
      // Failed sources are silently skipped
    }

    return suggestions.slice(0, this.maxResults)
  }

  /** Number of registered sources. */
  get sourceCount(): number {
    return this.sources.length
  }
}
