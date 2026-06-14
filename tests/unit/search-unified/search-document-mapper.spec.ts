// tests/unit/search-unified/search-document-mapper.spec.ts — CE8-C1 Mapper tests

import { describe, it, expect } from 'vitest'
import { SearchDocumentMapper } from '@/modules/search-unified/infrastructure/mappers/SearchDocumentMapper'

describe('SearchDocumentMapper', () => {
  const mapper = new SearchDocumentMapper()

  it('should map raw input to SearchDocument', () => {
    const doc = mapper.toDocument({
      id: 'tmdb:157336',
      title: 'Interstellar',
      type: 'movie',
      year: 2014,
      genres: ['Sci-Fi'],
      externalIds: { tmdb: 157336 },
      source: 'metadata',
      sourceId: 'tmdb',
      popularity: 95,
    })
    expect(doc.id).toBe('tmdb:157336')
    expect(doc.contentId).toBe('tmdb:157336')
    expect(doc.title).toBe('Interstellar')
    expect(doc.source).toBe('metadata')
  })

  it('should generate contentId with priority', () => {
    const doc = mapper.toDocument({
      id: 'x', title: 'X', type: 'movie',
      externalIds: { tmdb: 1, imdb: 'tt2', bangumi: 3 },
      source: 'metadata', sourceId: 'tmdb',
    })
    expect(doc.contentId).toBe('tmdb:1')
  })

  it('should fallback contentId', () => {
    const doc = mapper.toDocument({
      id: 'x', title: 'X', type: 'movie',
      source: 'metadata', sourceId: 'bangumi',
    })
    expect(doc.contentId).toBe('bangumi:movie')
  })

  it('should default popularity to 50', () => {
    const doc = mapper.toDocument({
      id: 'x', title: 'X', type: 'movie', source: 'metadata', sourceId: 'test',
    })
    expect(doc.popularity).toBe(50)
  })

  it('should map multiple documents', () => {
    const docs = mapper.toDocuments([
      { id: '1', title: 'A', type: 'movie', source: 'metadata', sourceId: 'x' },
      { id: '2', title: 'B', type: 'tv', source: 'server', sourceId: 'y' },
    ])
    expect(docs).toHaveLength(2)
    expect(docs[0].type).toBe('movie')
    expect(docs[1].type).toBe('tv')
  })
})
