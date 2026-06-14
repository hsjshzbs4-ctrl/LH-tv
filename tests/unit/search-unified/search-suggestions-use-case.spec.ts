// tests/unit/search-unified/search-suggestions-use-case.spec.ts — CE8-B SearchSuggestionsUseCase tests

import { describe, it, expect } from 'vitest'
import { SearchSuggestionsUseCase } from '@/modules/search-unified/application/use-cases/SearchSuggestionsUseCase'
import type { ISearchSuggestionPort } from '@/modules/search-unified/application/ports/ISearchSuggestionPort'

class MockSuggestionPort implements ISearchSuggestionPort {
  private suggestions: Map<string, string[]> = new Map()
  set(query: string, results: string[]) { this.suggestions.set(query, results) }
  async suggest(query: string): Promise<string[]> {
    return this.suggestions.get(query) ?? []
  }
}

describe('SearchSuggestionsUseCase', () => {
  it('should return suggestions for valid query', async () => {
    const port = new MockSuggestionPort()
    port.set('int', ['Interstellar', 'Inception', 'Inside Out'])
    const useCase = new SearchSuggestionsUseCase(port)

    const result = await useCase.execute('int')
    expect(result.suggestions).toHaveLength(3)
    expect(result.suggestions[0]).toBe('Interstellar')
    expect(result.events).toHaveLength(1)
    expect(result.events[0].type).toBe('SearchSuggestionsGenerated')
  })

  it('should return empty for short query', async () => {
    const port = new MockSuggestionPort()
    const useCase = new SearchSuggestionsUseCase(port)

    const result = await useCase.execute('i')
    expect(result.suggestions).toHaveLength(0)
    expect(result.events).toHaveLength(0)
  })

  it('should return empty for whitespace-only short query', async () => {
    const port = new MockSuggestionPort()
    const useCase = new SearchSuggestionsUseCase(port)

    const result = await useCase.execute(' a ')
    expect(result.suggestions).toHaveLength(0)
  })

  it('should limit to 10 suggestions', async () => {
    const port = new MockSuggestionPort()
    const many = Array.from({ length: 15 }, (_, i) => `Suggestion ${i}`)
    port.set('test', many)
    const useCase = new SearchSuggestionsUseCase(port)

    const result = await useCase.execute('test')
    expect(result.suggestions).toHaveLength(10)
  })
})
