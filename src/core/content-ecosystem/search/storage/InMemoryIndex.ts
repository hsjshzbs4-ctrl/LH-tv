// core/content-ecosystem/search/storage/InMemoryIndex.ts — CE7.2 Inverted index
// O(k) keyword search via inverted indexes instead of O(n) full scan.
//
// Indexes:
//   titleTokenIndex  — lowercase tokens from title → docId[]
//   aliasTokenIndex  — lowercase tokens from aliases → docId[]
//   genreIndex       — genre → docId[]
//   typeIndex        — SearchDocumentType → docId[]
//
// Performance targets: 10K docs < 50ms, 50K docs < 200ms

import { SearchDocumentType } from '../contracts/search.types'
import type { SearchDocument, SearchSource } from '../contracts/search.types'

export class InMemoryIndex {
  /** Primary store: O(1) ID lookup */
  private docs: Map<string, SearchDocument> = new Map()

  /** Inverted index: title token → doc IDs */
  private titleTokenIndex: Map<string, Set<string>> = new Map()

  /** Inverted index: alias token → doc IDs */
  private aliasTokenIndex: Map<string, Set<string>> = new Map()

  /** Inverted index: genre → doc IDs */
  private genreIndex: Map<string, Set<string>> = new Map()

  /** Inverted index: type → doc IDs */
  private typeIndex: Map<SearchDocumentType, Set<string>> = new Map()

  // ─── CRUD ───

  add(doc: SearchDocument): void {
    // Remove old entry if exists (for idempotent re-add)
    this.remove(doc.id)

    // Primary store
    this.docs.set(doc.id, doc)

    // Populate inverted indexes
    this._indexTokens(this.titleTokenIndex, doc.title, doc.id)
    for (const alias of doc.aliases) {
      this._indexTokens(this.aliasTokenIndex, alias, doc.id)
    }
    for (const genre of doc.genres) {
      this._indexOne(this.genreIndex, genre.toLowerCase(), doc.id)
    }
    this._indexOne(this.typeIndex, doc.type, doc.id)
  }

  remove(id: string): boolean {
    const doc = this.docs.get(id)
    if (!doc) return false

    // Remove from inverted indexes
    this._unindexTokens(this.titleTokenIndex, doc.title, id)
    for (const alias of doc.aliases) {
      this._unindexTokens(this.aliasTokenIndex, alias, id)
    }
    for (const genre of doc.genres) {
      this._unindexOne(this.genreIndex, genre.toLowerCase(), id)
    }
    this._unindexOne(this.typeIndex, doc.type, id)

    this.docs.delete(id)
    return true
  }

  update(id: string, updates: Partial<SearchDocument>): boolean {
    const existing = this.docs.get(id)
    if (!existing) return false

    const updated: SearchDocument = { ...existing, ...updates, id: existing.id }
    // Replace atomically via remove + add
    this.remove(id)
    this.add(updated)
    return true
  }

  clear(): void {
    this.docs.clear()
    this.titleTokenIndex.clear()
    this.aliasTokenIndex.clear()
    this.genreIndex.clear()
    this.typeIndex.clear()
  }

  // ─── Read ───

  get(id: string): SearchDocument | undefined {
    return this.docs.get(id)
  }

  getAll(): SearchDocument[] {
    return Array.from(this.docs.values())
  }

  get size(): number {
    return this.docs.size
  }

  // ─── O(k) Search Primitives ───

  /**
   * Search by tokens using inverted indexes.
   * Returns candidate documents matching any token in title or aliases.
   * Order: title-matched docs first, then alias-matched.
   * Complexity: O(k) where k = number of matching documents.
   */
  searchByTokens(tokens: string[]): SearchDocument[] {
    if (tokens.length === 0) return []

    const seen = new Set<string>()
    const results: SearchDocument[] = []

    // Collect title-matched IDs first
    const titleMatchedIds = this._resolveTokens(this.titleTokenIndex, tokens)
    for (const id of titleMatchedIds) {
      const doc = this.docs.get(id)
      if (doc && !seen.has(id)) {
        seen.add(id)
        results.push(doc)
      }
    }

    // Then alias-matched IDs (not already in title results)
    const aliasMatchedIds = this._resolveTokens(this.aliasTokenIndex, tokens)
    for (const id of aliasMatchedIds) {
      if (seen.has(id)) continue
      const doc = this.docs.get(id)
      if (doc) {
        seen.add(id)
        results.push(doc)
      }
    }

    return results
  }

  getByGenre(genre: string): SearchDocument[] {
    const ids = this.genreIndex.get(genre.toLowerCase())
    if (!ids) return []
    return this._docsFromIds(ids)
  }

  getByType(type: SearchDocumentType): SearchDocument[] {
    const ids = this.typeIndex.get(type)
    if (!ids) return []
    return this._docsFromIds(ids)
  }

  getBySource(source: SearchSource): SearchDocument[] {
    const results: SearchDocument[] = []
    for (const doc of this.docs.values()) {
      if (doc.source === source) results.push(doc)
    }
    return results
  }

  // ─── Internal Helpers ───

  /** Tokenize text for indexing. Filters tokens < 2 chars except CJK. */
  static tokenize(text: string): string[] {
    const lower = text.toLowerCase()
    const tokens: string[] = []

    // Standard word tokenization (splits on separators)
    const words = lower
      .split(/[\s\-_,.:;、，。·/()\[\]{}「」『』【】《》]+/)
      .map(t => t.trim())
      .filter(t => t.length >= 2)
    tokens.push(...words)

    // CJK character-level tokens (single CJK chars carry meaning)
    // Exclude Hiragana-only since those are grammatical particles
    const cjkChars = lower.match(/[\p{Script=Han}\p{Script=Katakana}]/gu)
    if (cjkChars) {
      for (const char of cjkChars) {
        tokens.push(char)
      }
    }

    return tokens
  }

  private _indexTokens(index: Map<string, Set<string>>, text: string, docId: string): void {
    for (const token of InMemoryIndex.tokenize(text)) {
      this._indexOne(index, token, docId)
    }
  }

  private _unindexTokens(index: Map<string, Set<string>>, text: string, docId: string): void {
    for (const token of InMemoryIndex.tokenize(text)) {
      this._unindexOne(index, token, docId)
    }
  }

  private _indexOne(index: Map<string, Set<string>>, key: string, docId: string): void {
    let set = index.get(key)
    if (!set) {
      set = new Set()
      index.set(key, set)
    }
    set.add(docId)
  }

  private _unindexOne(index: Map<string, Set<string>>, key: string, docId: string): void {
    const set = index.get(key)
    if (!set) return
    set.delete(docId)
    if (set.size === 0) {
      index.delete(key)
    }
  }

  /** Resolve tokens to union of matching doc IDs. */
  private _resolveTokens(index: Map<string, Set<string>>, tokens: string[]): Set<string> {
    const result = new Set<string>()
    for (const token of tokens) {
      const ids = index.get(token)
      if (ids) {
        for (const id of ids) result.add(id)
      }
    }
    return result
  }

  private _docsFromIds(ids: Set<string>): SearchDocument[] {
    const results: SearchDocument[] = []
    for (const id of ids) {
      const doc = this.docs.get(id)
      if (doc) results.push(doc)
    }
    return results
  }
}
