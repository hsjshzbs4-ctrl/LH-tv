// core/content-ecosystem/search/contracts/ISearchDataSource.ts — CE7.1 Data source abstraction
// Decouples SearchIndexBuilder from concrete Facade implementations.
// Third-party data sources (CE10+) implement this interface.

import type { SearchDocument, SearchSource } from './search.types'

export interface ISearchDataSource {
  /** 数据源唯一标识，如 'tmdb' / 'local-library' / 'jellyfin-1' */
  readonly sourceId: string

  /** 数据源类型 */
  readonly sourceType: SearchSource

  /** 获取该数据源全部可索引文档 */
  getDocuments(): Promise<SearchDocument[]>

  /** 数据源是否可用（已连接 / 已初始化） */
  isAvailable(): boolean
}
