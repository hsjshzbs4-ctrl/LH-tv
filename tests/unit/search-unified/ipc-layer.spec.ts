// tests/unit/search-unified/ipc-layer.spec.ts — CE8-D IPC layer tests

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SearchIPCController } from '@/modules/search-unified/ipc/controller/SearchIPCController'
import { SearchIPCClient } from '@/modules/search-unified/ipc/client/SearchIPCClient'
import { SearchIPCRegistration } from '@/modules/search-unified/ipc/registration/SearchIPCRegistration'
import { SearchIPCSchemaValidator } from '@/modules/search-unified/ipc/validation/SearchIPCSchemaValidator'
import { SearchIPCErrorMapper } from '@/modules/search-unified/ipc/mappers/SearchIPCErrorMapper'
import { SearchIPCRequestMapper } from '@/modules/search-unified/ipc/mappers/SearchIPCRequestMapper'
import { SearchIPCResponseMapper } from '@/modules/search-unified/ipc/mappers/SearchIPCResponseMapper'
import { SearchIPCHealthEndpoint } from '@/modules/search-unified/ipc/health/SearchIPCHealthEndpoint'
import { SEARCH_IPC_CHANNELS } from '@/modules/search-unified/ipc/channels/SearchIPCChannels'
import { IPC_CONTRACT_VERSION } from '@/modules/search-unified/ipc/contracts/SearchIPCContracts'
import { SearchError } from '@/modules/search-unified/application/errors/SearchErrors'

// ─── Helpers ───

function mockFacade(overrides: Record<string, unknown> = {}) {
  return {
    search: vi.fn().mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0, totalPages: 1, hasNextPage: false, searchTimeMs: 10 }),
    suggest: vi.fn().mockResolvedValue([]),
    recordClick: vi.fn(), recordPlay: vi.fn(),
    getHistory: vi.fn().mockReturnValue([]),
    getTrending: vi.fn().mockReturnValue([]),
    getProfile: vi.fn().mockReturnValue(null),
    getStatus: vi.fn().mockReturnValue({ state: 'ready', providers: [], analytics: { bufferSize: 0, totalCalls: 0 } }),
    validateReadiness: vi.fn().mockReturnValue({ ready: true, passedCount: 8, failedCount: 0 }),
    ...overrides,
  } as any
}

// ─── Validator Tests ───

describe('SearchIPCSchemaValidator', () => {
  const v = new SearchIPCSchemaValidator()

  it('should accept valid query', () => expect(v.validateSearchQuery('test').valid).toBe(true))
  it('should reject non-string query', () => expect(v.validateSearchQuery(123).valid).toBe(false))
  it('should reject overlong query', () => expect(v.validateSearchQuery('a'.repeat(513)).valid).toBe(false))

  it('should accept valid pagination', () => expect(v.validatePagination(2, 20).valid).toBe(true))
  it('should reject page < 1', () => expect(v.validatePagination(0, 20).valid).toBe(false))
  it('should reject pageSize > 100', () => expect(v.validatePagination(1, 200).valid).toBe(false))

  it('should accept valid version', () => expect(v.validateVersion(1).valid).toBe(true))
  it('should reject missing version', () => expect(v.validateVersion(undefined).valid).toBe(false))
})

// ─── Error Mapper ───

describe('SearchIPCErrorMapper', () => {
  const mapper = new SearchIPCErrorMapper()

  it('should map known errors safely', () => {
    const err = new SearchError('test', 'TEST_ERR')
    const safe = mapper.toSafeError(err)
    expect(safe.code).toBe('TEST_ERR')
  })

  it('should never leak stack traces', () => {
    const err = new Error('sensitive /home/user/secret.txt')
    const safe = mapper.toSafeError(err)
    expect(safe.message).not.toContain('/home')
    expect(safe.message).not.toContain('secret')
  })
})

// ─── Request/Response Mappers ───

describe('IPC Mappers', () => {
  it('should map search request to DTO', () => {
    const m = new SearchIPCRequestMapper()
    const dto = m.toSearchRequest({ version: 1, query: 'test', page: 2 })
    expect(dto.query).toBe('test')
    expect(dto.page).toBe(2)
  })

  it('should map search response from DTO', () => {
    const m = new SearchIPCResponseMapper()
    const resp = m.toSearchResponse({ items: [], page: 1, pageSize: 20, total: 0, totalPages: 1, hasNextPage: false, searchTimeMs: 10 })
    expect(resp.version).toBe(IPC_CONTRACT_VERSION)
  })

  it('should include version in all responses', () => {
    const m = new SearchIPCResponseMapper()
    expect(m.toSuggestionResponse(['a']).version).toBe(IPC_CONTRACT_VERSION)
    expect(m.toHistoryResponse([]).version).toBe(IPC_CONTRACT_VERSION)
    expect(m.toTrendingResponse([]).version).toBe(IPC_CONTRACT_VERSION)
  })
})

// ─── Controller ───

describe('SearchIPCController', () => {
  it('should delegate search to facade', async () => {
    const facade = mockFacade({ search: vi.fn().mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0, totalPages: 1, hasNextPage: false, searchTimeMs: 5 }) })
    const ctrl = new SearchIPCController(facade)
    const resp = await ctrl.search({ version: 1, query: 'test' })
    expect('version' in resp && resp.version).toBe(1)
  })

  it('should return error for invalid search query', async () => {
    const facade = mockFacade()
    const ctrl = new SearchIPCController(facade)
    const resp = await ctrl.search({ version: 1, query: 'a'.repeat(600) })
    expect('code' in resp).toBe(true)
  })

  it('should delegate suggest to facade', async () => {
    const facade = mockFacade({ suggest: vi.fn().mockResolvedValue(['Interstellar']) })
    const ctrl = new SearchIPCController(facade)
    const resp = await ctrl.suggest({ version: 1, query: 'in' })
    expect('suggestions' in resp && resp.suggestions).toContain('Interstellar')
  })
})

// ─── Client (with mock transport) ───

describe('SearchIPCClient', () => {
  it('should invoke search via transport', async () => {
    const transport = { invoke: vi.fn().mockResolvedValue({ version: 1, items: [], page: 1, pageSize: 20, total: 0, totalPages: 1, hasNextPage: false, searchTimeMs: 0 }) }
    const client = new SearchIPCClient(transport)
    const resp = await client.search('test')
    expect(transport.invoke).toHaveBeenCalledWith(SEARCH_IPC_CHANNELS.SEARCH_EXECUTE, expect.objectContaining({ query: 'test' }))
    expect('version' in resp && resp.version).toBe(1)
  })

  it('should invoke suggest via transport', async () => {
    const transport = { invoke: vi.fn().mockResolvedValue({ version: 1, suggestions: ['A'] }) }
    const client = new SearchIPCClient(transport)
    await client.suggest('in')
    expect(transport.invoke).toHaveBeenCalledWith(SEARCH_IPC_CHANNELS.SEARCH_SUGGEST, expect.any(Object))
  })
})

// ─── Registration ───

describe('SearchIPCRegistration', () => {
  it('should register all 9 channels', () => {
    const registry = { handle: vi.fn(), removeHandler: vi.fn() }
    const facade = mockFacade()
    const ctrl = new SearchIPCController(facade)
    const reg = new SearchIPCRegistration(registry, ctrl)

    reg.register()
    expect(registry.handle).toHaveBeenCalledTimes(9)
    expect(reg.isRegistered).toBe(true)

    reg.unregister()
    expect(reg.isRegistered).toBe(false)
  })

  it('should be idempotent', () => {
    const registry = { handle: vi.fn(), removeHandler: vi.fn() }
    const facade = mockFacade()
    const reg = new SearchIPCRegistration(registry, new SearchIPCController(facade))

    reg.register()
    reg.register()
    expect(registry.handle).toHaveBeenCalledTimes(9)
  })
})

// ─── Health Endpoint ───

describe('SearchIPCHealthEndpoint', () => {
  it('should return health snapshot', () => {
    const facade = mockFacade()
    const endpoint = new SearchIPCHealthEndpoint(facade)
    const health = endpoint.getHealth()
    expect(health.moduleState).toBe('ready')
    expect(health.readiness.ready).toBe(true)
  })
})
