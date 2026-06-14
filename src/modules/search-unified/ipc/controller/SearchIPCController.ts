// modules/search-unified/ipc/controller/SearchIPCController.ts — CE8-D
// Main process bridge. Validates → Calls Facade → Maps response → Handles errors.
// No business logic. Only delegation.

import type { UnifiedSearchFacade } from '../../bootstrap/UnifiedSearchFacade'
import { SearchIPCRequestMapper } from '../mappers/SearchIPCRequestMapper'
import { SearchIPCResponseMapper } from '../mappers/SearchIPCResponseMapper'
import { SearchIPCErrorMapper } from '../mappers/SearchIPCErrorMapper'
import { SearchIPCSchemaValidator } from '../validation/SearchIPCSchemaValidator'
import type { SearchIPCRequest, SuggestionIPCRequest, ClickIPCRequest, PlayIPCRequest, HistoryIPCRequest, TrendingIPCRequest, ProfileIPCRequest, SearchIPCResponse, SuggestionIPCResponse, HistoryIPCResponse, TrendingIPCResponse, ProfileIPCResponse, HealthIPCResponse, SearchIPCError } from '../contracts/SearchIPCContracts'

export class SearchIPCController {
  private requestMapper = new SearchIPCRequestMapper()
  private responseMapper = new SearchIPCResponseMapper()
  private errorMapper = new SearchIPCErrorMapper()
  private validator = new SearchIPCSchemaValidator()

  constructor(private facade: UnifiedSearchFacade) {}

  // ─── Search ───
  async search(request: SearchIPCRequest): Promise<SearchIPCResponse | SearchIPCError> {
    try {
      const vv = this.validator.validateVersion(request.version)
      if (!vv.valid) return this.errorMapper.toSafeError(new Error(vv.error))
      const qv = this.validator.validateSearchQuery(request.query)
      if (!qv.valid) return this.errorMapper.toSafeError(new Error(qv.error))
      const pv = this.validator.validatePagination(request.page, request.pageSize)
      if (!pv.valid) return this.errorMapper.toSafeError(new Error(pv.error))

      const dto = this.requestMapper.toSearchRequest(request)
      const response = await this.facade.search(dto)
      return this.responseMapper.toSearchResponse(response)
    } catch (err) {
      return this.errorMapper.toSafeError(err)
    }
  }

  // ─── Suggestions ───
  async suggest(request: SuggestionIPCRequest): Promise<SuggestionIPCResponse | SearchIPCError> {
    try {
      const vv = this.validator.validateVersion(request.version)
      if (!vv.valid) return this.errorMapper.toSafeError(new Error(vv.error))
      const qv = this.validator.validateSuggestQuery(request.query)
      if (!qv.valid) return this.errorMapper.toSafeError(new Error(qv.error))

      const suggestions = await this.facade.suggest(request.query)
      return this.responseMapper.toSuggestionResponse(suggestions)
    } catch (err) {
      return this.errorMapper.toSafeError(err)
    }
  }

  // ─── Click ───
  recordClick(request: ClickIPCRequest): void {
    try {
      const r = this.requestMapper.toClickRequest(request)
      this.facade.recordClick(r.contentId, r.query, r.position)
    } catch { /* fire-and-forget */ }
  }

  // ─── Play ───
  recordPlay(request: PlayIPCRequest): void {
    try {
      const r = this.requestMapper.toPlayRequest(request)
      this.facade.recordPlay(r.contentId, r.sourceId)
    } catch { /* fire-and-forget */ }
  }

  // ─── History ───
  getHistory(request: HistoryIPCRequest): HistoryIPCResponse | SearchIPCError {
    try {
      const vv = this.validator.validateVersion(request.version)
      if (!vv.valid) return this.errorMapper.toSafeError(new Error(vv.error))
      const lv = this.validator.validateHistoryLimit(request.limit)
      if (!lv.valid) return this.errorMapper.toSafeError(new Error(lv.error))

      const entries = this.facade.getHistory(request.limit ?? 50)
      return this.responseMapper.toHistoryResponse(entries)
    } catch (err) {
      return this.errorMapper.toSafeError(err)
    }
  }

  // ─── Trending ───
  getTrending(request: TrendingIPCRequest): TrendingIPCResponse | SearchIPCError {
    try {
      const entries = this.facade.getTrending(request.limit ?? 20)
      return this.responseMapper.toTrendingResponse(entries)
    } catch (err) {
      return this.errorMapper.toSafeError(err)
    }
  }

  // ─── Profile ───
  getProfile(_request: ProfileIPCRequest): ProfileIPCResponse | SearchIPCError {
    try {
      const profile = this.facade.getProfile()
      return this.responseMapper.toProfileResponse(profile)
    } catch (err) {
      return this.errorMapper.toSafeError(err)
    }
  }

  // ─── Health ───
  getHealth(): HealthIPCResponse | SearchIPCError {
    try {
      const diag = this.facade.getStatus()
      return this.responseMapper.toHealthResponse(diag)
    } catch (err) {
      return this.errorMapper.toSafeError(err)
    }
  }
}
