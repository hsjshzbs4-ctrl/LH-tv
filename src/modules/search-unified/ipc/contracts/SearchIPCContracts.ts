// modules/search-unified/ipc/contracts/SearchIPCContracts.ts — CE8-D
// IPC request/response contracts with versioning. Future-safe.

export const IPC_CONTRACT_VERSION = 1

// ─── Search ───
export interface SearchIPCRequest {
  readonly version: number
  readonly query: string
  readonly page?: number
  readonly pageSize?: number
  readonly mediaTypes?: string[]
}

export interface SearchIPCResponse {
  readonly version: number
  readonly items: SearchIPCItem[]
  readonly page: number
  readonly pageSize: number
  readonly total: number
  readonly totalPages: number
  readonly hasNextPage: boolean
  readonly searchTimeMs: number
}

export interface SearchIPCItem {
  readonly contentId: string
  readonly title: string
  readonly originalTitle?: string
  readonly mediaType: string
  readonly overview?: string
  readonly poster?: string
  readonly year?: number
  readonly score: number
  readonly genres: string[]
  readonly sourceCount: number
  readonly isPlayable: boolean
  readonly availability: { playable: boolean; preferredSourceType: string | null; bestQuality: number; localAvailable: boolean }
}

// ─── Suggestions ───
export interface SuggestionIPCRequest { readonly version: number; readonly query: string }
export interface SuggestionIPCResponse { readonly version: number; readonly suggestions: string[] }

// ─── Click/Play ───
export interface ClickIPCRequest { readonly version: number; readonly contentId: string; readonly query: string; readonly position: number }
export interface PlayIPCRequest { readonly version: number; readonly contentId: string; readonly sourceId: string }

// ─── History ───
export interface HistoryIPCRequest { readonly version: number; readonly limit?: number }
export interface HistoryIPCResponse {
  readonly version: number
  readonly entries: Array<{ id: string; query: string; frequency: number; lastSearchedAt: number }>
}

// ─── Trending ───
export interface TrendingIPCRequest { readonly version: number; readonly limit?: number }
export interface TrendingIPCResponse {
  readonly version: number
  readonly entries: Array<{ query: string; count: number; rollingScore: number }>
}

// ─── Profile ───
export interface ProfileIPCRequest { readonly version: number }
export interface ProfileIPCResponse {
  readonly version: number
  readonly profile: {
    readonly generatedAt: number
    readonly favoriteProviders: string[]
    readonly frequentQueries: string[]
    readonly recentInteractions: string[]
  }
}

// ─── Health ───
export interface HealthIPCResponse {
  readonly version: number
  readonly state: string
  readonly providers: Array<{ id: string; available: boolean }>
  readonly analytics: { bufferSize: number; totalCalls: number }
}

// ─── IPC Error ───
export interface SearchIPCError {
  readonly version: number
  readonly code: string
  readonly message: string
  readonly recoverable: boolean
}
