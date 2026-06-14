// core/content-ecosystem/search/storage/MemorySearchStorage.ts — CE7.2 In-memory storage
// Pure in-memory implementation of ISearchStorage.
// Used for testing and non-Electron environments.

import type { ISearchStorage } from '../contracts/ISearchStorage'
import type { SearchDocument } from '../contracts/search.types'

export class MemorySearchStorage implements ISearchStorage {
  private data: SearchDocument[] = []

  async load(): Promise<SearchDocument[]> {
    return [...this.data]
  }

  async save(documents: SearchDocument[]): Promise<void> {
    this.data = [...documents]
  }

  async clear(): Promise<void> {
    this.data = []
  }
}
