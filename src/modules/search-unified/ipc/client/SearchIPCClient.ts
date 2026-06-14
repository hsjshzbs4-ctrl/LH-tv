// modules/search-unified/ipc/client/SearchIPCClient.ts — CE8-D
// Renderer-side SDK. Vue components must use this client — never ipcRenderer directly.

import { SEARCH_IPC_CHANNELS } from '../channels/SearchIPCChannels'
import { IPC_CONTRACT_VERSION } from '../contracts/SearchIPCContracts'
import type {
  SearchIPCRequest, SearchIPCResponse,
  SuggestionIPCRequest, SuggestionIPCResponse,
  ClickIPCRequest, PlayIPCRequest,
  HistoryIPCRequest, HistoryIPCResponse,
  TrendingIPCRequest, TrendingIPCResponse,
  ProfileIPCRequest, ProfileIPCResponse,
  HealthIPCResponse, SearchIPCError,
} from '../contracts/SearchIPCContracts'

export interface IPCTransport {
  invoke(channel: string, ...args: any[]): Promise<any>
}

export class SearchIPCClient {
  constructor(private transport: IPCTransport) {}

  async search(query: string, options?: { page?: number; pageSize?: number; mediaTypes?: string[] }): Promise<SearchIPCResponse | SearchIPCError> {
    const request: SearchIPCRequest = { version: IPC_CONTRACT_VERSION, query, ...options }
    return this.transport.invoke(SEARCH_IPC_CHANNELS.SEARCH_EXECUTE, request) as Promise<SearchIPCResponse | SearchIPCError>
  }

  async suggest(query: string): Promise<SuggestionIPCResponse | SearchIPCError> {
    const request: SuggestionIPCRequest = { version: IPC_CONTRACT_VERSION, query }
    return this.transport.invoke(SEARCH_IPC_CHANNELS.SEARCH_SUGGEST, request) as Promise<SuggestionIPCResponse | SearchIPCError>
  }

  recordClick(contentId: string, query: string, position: number): void {
    const request: ClickIPCRequest = { version: IPC_CONTRACT_VERSION, contentId, query, position }
    this.transport.invoke(SEARCH_IPC_CHANNELS.SEARCH_CLICK, request).catch(() => {})
  }

  recordPlay(contentId: string, sourceId: string): void {
    const request: PlayIPCRequest = { version: IPC_CONTRACT_VERSION, contentId, sourceId }
    this.transport.invoke(SEARCH_IPC_CHANNELS.SEARCH_PLAY, request).catch(() => {})
  }

  async getHistory(limit?: number): Promise<HistoryIPCResponse | SearchIPCError> {
    const request: HistoryIPCRequest = { version: IPC_CONTRACT_VERSION, limit }
    return this.transport.invoke(SEARCH_IPC_CHANNELS.SEARCH_HISTORY, request) as Promise<HistoryIPCResponse | SearchIPCError>
  }

  async getTrending(limit?: number): Promise<TrendingIPCResponse | SearchIPCError> {
    const request: TrendingIPCRequest = { version: IPC_CONTRACT_VERSION, limit }
    return this.transport.invoke(SEARCH_IPC_CHANNELS.SEARCH_TRENDING, request) as Promise<TrendingIPCResponse | SearchIPCError>
  }

  async getProfile(): Promise<ProfileIPCResponse | SearchIPCError> {
    const request: ProfileIPCRequest = { version: IPC_CONTRACT_VERSION }
    return this.transport.invoke(SEARCH_IPC_CHANNELS.SEARCH_PROFILE, request) as Promise<ProfileIPCResponse | SearchIPCError>
  }

  async getHealth(): Promise<HealthIPCResponse | SearchIPCError> {
    return this.transport.invoke(SEARCH_IPC_CHANNELS.SEARCH_HEALTH) as Promise<HealthIPCResponse | SearchIPCError>
  }
}
