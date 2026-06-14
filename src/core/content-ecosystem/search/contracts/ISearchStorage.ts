// core/content-ecosystem/search/contracts/ISearchStorage.ts — CE7.1 Storage abstraction
// Decouples SearchIndexRepository from concrete storage (window.app / localStorage / filesystem)

import type { SearchDocument } from './search.types'

export interface ISearchStorage {
  /** 加载全部文档 */
  load(): Promise<SearchDocument[]>

  /** 保存全部文档 */
  save(documents: SearchDocument[]): Promise<void>

  /** 清空存储 */
  clear(): Promise<void>
}
