// core/content-ecosystem/search/index/SearchIndexRepository.ts — CE7.3 Persistence layer
// Wraps InMemoryIndex with ISearchStorage for persistence.
// No business logic — only CRUD + stats.

import { InMemoryIndex } from '../storage/InMemoryIndex'
import type { ISearchStorage } from '../contracts/ISearchStorage'
import type { SearchDocument, IndexStats } from '../contracts/search.types'

export class SearchIndexRepository {
  private index: InMemoryIndex
  private storage: ISearchStorage
  private _lastBuiltAt: number = 0
  private _buildTimeMs: number = 0

  constructor(storage: ISearchStorage) {
    this.index = new InMemoryIndex()
    this.storage = storage
  }

  // ─── Persistence ───

  /** Load documents from storage into the in-memory index. */
  async load(): Promise<void> {
    const docs = await this.storage.load()
    for (const doc of docs) {
      this.index.add(doc)
    }
  }

  /** Persist current index to storage. */
  async persist(): Promise<void> {
    await this.storage.save(this.index.getAll())
  }

  // ─── CRUD ───

  saveDocument(doc: SearchDocument): void {
    this.index.add(doc)
  }

  saveDocuments(docs: SearchDocument[]): void {
    for (const doc of docs) {
      this.index.add(doc)
    }
  }

  deleteDocument(id: string): boolean {
    return this.index.remove(id)
  }

  findById(id: string): SearchDocument | undefined {
    return this.index.get(id)
  }

  getAll(): SearchDocument[] {
    return this.index.getAll()
  }

  getByType(type: Parameters<typeof this.index.getByType>[0]): SearchDocument[] {
    return this.index.getByType(type)
  }

  getBySource(source: Parameters<typeof this.index.getBySource>[0]): SearchDocument[] {
    return this.index.getBySource(source)
  }

  searchByTokens(tokens: string[]): SearchDocument[] {
    return this.index.searchByTokens(tokens)
  }

  clear(): void {
    this.index.clear()
  }

  get size(): number {
    return this.index.size
  }

  // ─── Build tracking ───

  markBuilt(elapsedMs: number): void {
    this._lastBuiltAt = Date.now()
    this._buildTimeMs = elapsedMs
  }

  // ─── Stats ───

  getStats(): IndexStats {
    const all = this.index.getAll()
    const contentIds = new Set<string>()
    const dupContentIds = new Set<string>()
    let dupCount = 0

    const bySource: Record<string, number> = {}
    const byType: Record<string, number> = {}

    for (const doc of all) {
      // contentId dedup
      if (contentIds.has(doc.contentId)) {
        dupContentIds.add(doc.contentId)
        dupCount++
      } else {
        contentIds.add(doc.contentId)
      }

      // bySource
      bySource[doc.source] = (bySource[doc.source] || 0) + 1

      // byType
      byType[doc.type] = (byType[doc.type] || 0) + 1
    }

    return {
      totalDocuments: all.length,
      uniqueContentCount: contentIds.size,
      duplicateContentCount: dupCount,
      indexSizeBytes: this._estimateSize(all.length),
      bySource,
      byType,
      lastBuiltAt: this._lastBuiltAt,
      buildTimeMs: this._buildTimeMs,
    }
  }

  /** Rough memory estimate: ~500 bytes per document + index overhead */
  private _estimateSize(docCount: number): number {
    // Map entry + inverted index sets: ~200 bytes overhead per doc
    // SearchDocument fields: ~500 bytes average
    return docCount * 700
  }
}
