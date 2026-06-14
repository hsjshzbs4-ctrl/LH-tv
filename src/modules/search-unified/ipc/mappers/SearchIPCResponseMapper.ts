// modules/search-unified/ipc/mappers/SearchIPCResponseMapper.ts — CE8-D
// Maps application DTOs → IPC response contracts.

import { IPC_CONTRACT_VERSION } from '../contracts/SearchIPCContracts'
import type { SearchIPCResponse, SuggestionIPCResponse, HistoryIPCResponse, TrendingIPCResponse, ProfileIPCResponse, HealthIPCResponse } from '../contracts/SearchIPCContracts'
import type { SearchResponseDto } from '../../application/dto/SearchResponseDto'
import type { SearchHistoryEntry } from '../../infrastructure/storage/models/SearchHistoryEntry'
import type { SearchTrendEntry } from '../../infrastructure/storage/models/SearchTrendEntry'
import type { UserSearchProfile } from '../../infrastructure/storage/profile/UserSearchProfile'
import type { ModuleDiagnosticSnapshot } from '../../bootstrap/SearchModuleDiagnostics'

export class SearchIPCResponseMapper {
  toSearchResponse(dto: SearchResponseDto): SearchIPCResponse {
    return {
      version: IPC_CONTRACT_VERSION,
      items: dto.items.map(i => ({
        contentId: i.contentId, title: i.title, originalTitle: i.originalTitle,
        mediaType: i.mediaType, overview: i.overview, poster: i.poster,
        year: i.year, score: i.score, genres: i.genres,
        sourceCount: i.sourceCount, isPlayable: i.isPlayable,
        availability: {
          playable: i.availability.playable,
          preferredSourceType: i.availability.preferredSourceType,
          bestQuality: i.availability.bestQuality,
          localAvailable: i.availability.localAvailable,
        },
      })),
      page: dto.page, pageSize: dto.pageSize,
      total: dto.total, totalPages: dto.totalPages,
      hasNextPage: dto.hasNextPage, searchTimeMs: dto.searchTimeMs,
    }
  }

  toSuggestionResponse(suggestions: string[]): SuggestionIPCResponse {
    return { version: IPC_CONTRACT_VERSION, suggestions }
  }

  toHistoryResponse(entries: SearchHistoryEntry[]): HistoryIPCResponse {
    return {
      version: IPC_CONTRACT_VERSION,
      entries: entries.map(e => ({ id: e.id, query: e.query, frequency: e.frequency, lastSearchedAt: e.lastSearchedAt })),
    }
  }

  toTrendingResponse(entries: SearchTrendEntry[]): TrendingIPCResponse {
    return {
      version: IPC_CONTRACT_VERSION,
      entries: entries.map(e => ({ query: e.query, count: e.count, rollingScore: e.rollingScore })),
    }
  }

  toProfileResponse(profile: UserSearchProfile | null): ProfileIPCResponse {
    if (!profile) return { version: IPC_CONTRACT_VERSION, profile: { generatedAt: 0, favoriteProviders: [], frequentQueries: [], recentInteractions: [] } }
    return {
      version: IPC_CONTRACT_VERSION,
      profile: {
        generatedAt: profile.generatedAt,
        favoriteProviders: profile.favoriteProviders,
        frequentQueries: profile.frequentQueries,
        recentInteractions: profile.recentInteractions,
      },
    }
  }

  toHealthResponse(diag: ModuleDiagnosticSnapshot): HealthIPCResponse {
    return {
      version: IPC_CONTRACT_VERSION,
      state: diag.state,
      providers: diag.providers,
      analytics: diag.analytics,
    }
  }
}
