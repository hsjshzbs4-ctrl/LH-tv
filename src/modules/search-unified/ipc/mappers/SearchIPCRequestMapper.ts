// modules/search-unified/ipc/mappers/SearchIPCRequestMapper.ts — CE8-D
// Maps IPC request contracts → Application DTOs.

import type { SearchIPCRequest, SuggestionIPCRequest, ClickIPCRequest, PlayIPCRequest, HistoryIPCRequest, TrendingIPCRequest } from '../contracts/SearchIPCContracts'
import type { SearchRequestDto } from '../../application/dto/SearchRequestDto'

export class SearchIPCRequestMapper {
  toSearchRequest(r: SearchIPCRequest): SearchRequestDto {
    return {
      query: r.query,
      page: r.page,
      pageSize: r.pageSize,
      mediaTypes: r.mediaTypes as SearchRequestDto['mediaTypes'],
    }
  }

  toSuggestionQuery(r: SuggestionIPCRequest): string {
    return r.query
  }

  toClickRequest(r: ClickIPCRequest): { contentId: string; query: string; position: number } {
    return { contentId: r.contentId, query: r.query, position: r.position }
  }

  toPlayRequest(r: PlayIPCRequest): { contentId: string; sourceId: string } {
    return { contentId: r.contentId, sourceId: r.sourceId }
  }

  toHistoryLimit(r: HistoryIPCRequest): number {
    return r.limit ?? 50
  }

  toTrendingLimit(r: TrendingIPCRequest): number {
    return r.limit ?? 20
  }
}
