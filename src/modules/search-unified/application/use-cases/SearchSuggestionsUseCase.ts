// modules/search-unified/application/use-cases/SearchSuggestionsUseCase.ts — CE8-B
// Autocomplete / search suggestions use case.
// Delegates to ISearchSuggestionPort, enforces max limit.

import type { ISearchSuggestionPort } from '../ports/ISearchSuggestionPort'
import { AppEventFactory } from '../events/ApplicationEvents'
import type { ApplicationEvent } from '../events/ApplicationEvents'

const MAX_SUGGESTIONS = 10
const MIN_QUERY_LENGTH = 2

export interface SuggestionsResult {
  readonly suggestions: string[]
  readonly events: ApplicationEvent[]
}

export class SearchSuggestionsUseCase {
  constructor(private suggestionPort: ISearchSuggestionPort) {}

  /**
   * Generate autocomplete suggestions for a partial query.
   * Returns empty array for queries shorter than MIN_QUERY_LENGTH.
   */
  async execute(query: string): Promise<SuggestionsResult> {
    const trimmed = query.trim()

    if (trimmed.length < MIN_QUERY_LENGTH) {
      return { suggestions: [], events: [] }
    }

    const suggestions = await this.suggestionPort.suggest(trimmed, MAX_SUGGESTIONS)

    const events: ApplicationEvent[] = [
      AppEventFactory.suggestionsGenerated(trimmed, suggestions),
    ]

    return {
      suggestions: suggestions.slice(0, MAX_SUGGESTIONS),
      events,
    }
  }
}
