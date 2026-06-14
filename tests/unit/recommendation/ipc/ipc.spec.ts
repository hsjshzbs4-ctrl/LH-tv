// tests/unit/recommendation/ipc/ipc.spec.ts — CE9-E IPC Tests

import { describe, it, expect } from 'vitest'
import { RecommendationIPCChannels } from '@/modules/recommendation/ipc/channels/RecommendationIPCChannels'
import { IPC_CONTRACT_VERSION } from '@/modules/recommendation/ipc/contracts/RecommendationIPCContracts'
import { validateGenerateFeedRequest, validateTrackEventRequest } from '@/modules/recommendation/ipc/validators/IPCValidators'
import { mapRequestToDto, mapResponseToIPC } from '@/modules/recommendation/ipc/mappers/IPCMappers'
import { RecommendationIPCError, IPCValidationError, IPCTransportError, IPCTimeoutError, toSafeError } from '@/modules/recommendation/ipc/errors/IPCErrors'
import { IPCEventTypes } from '@/modules/recommendation/ipc/events/IPCEvents'
import { HealthHandler } from '@/modules/recommendation/ipc/handlers/HealthHandler'
import { MetricsHandler } from '@/modules/recommendation/ipc/handlers/MetricsHandler'
import type { GenerateFeedRequest, TrackEventRequest } from '@/modules/recommendation/ipc/contracts/RecommendationIPCContracts'

function makeGenerateRequest(overrides?: Partial<GenerateFeedRequest>): GenerateFeedRequest {
  return { version: 1, requestId: 'r1', userId: 'u1', experimentId: 'e1', variantId: 'v1', feedType: 'personalized', limit: 10, offset: 0, ...overrides }
}

function makeTrackRequest(overrides?: Partial<TrackEventRequest>): TrackEventRequest {
  return { version: 1, feedId: 'f1', mediaId: 'm1', action: 'click', ...overrides }
}

// ─── Channels ───

describe('RecommendationIPCChannels', () => {
  it('should define all 9 channels', () => {
    expect(RecommendationIPCChannels.GENERATE).toBe('recommendation:generate')
    expect(RecommendationIPCChannels.PERSONALIZED).toBe('recommendation:personalized')
    expect(RecommendationIPCChannels.TRENDING).toBe('recommendation:trending')
    expect(RecommendationIPCChannels.CONTINUE_WATCHING).toBe('recommendation:continueWatching')
    expect(RecommendationIPCChannels.SIMILAR).toBe('recommendation:similar')
    expect(RecommendationIPCChannels.TRACK_CLICK).toBe('recommendation:trackClick')
    expect(RecommendationIPCChannels.TRACK_CONSUME).toBe('recommendation:trackConsume')
    expect(RecommendationIPCChannels.HEALTH).toBe('recommendation:health')
    expect(RecommendationIPCChannels.METRICS).toBe('recommendation:metrics')
  })
})

// ─── Validators ───

describe('validateGenerateFeedRequest', () => {
  it('should pass valid request', () => {
    expect(validateGenerateFeedRequest(makeGenerateRequest())).toEqual([])
  })

  it('should reject missing userId', () => {
    expect(validateGenerateFeedRequest(makeGenerateRequest({ userId: '' }))).toContain('userId required')
  })

  it('should reject invalid version', () => {
    expect(validateGenerateFeedRequest(makeGenerateRequest({ version: 99 }))).toContain('Invalid version')
  })

  it('should reject invalid limit', () => {
    expect(validateGenerateFeedRequest(makeGenerateRequest({ limit: 0 }))).toContain('limit must be 1-100')
  })

  it('should reject negative offset', () => {
    expect(validateGenerateFeedRequest(makeGenerateRequest({ offset: -1 }))).toContain('offset must be >= 0')
  })
})

describe('validateTrackEventRequest', () => {
  it('should pass valid request', () => {
    expect(validateTrackEventRequest(makeTrackRequest())).toEqual([])
  })

  it('should reject invalid action', () => {
    const result = validateTrackEventRequest(makeTrackRequest({ action: 'invalid' as any }))
    expect(result.some(e => e.includes('Invalid action'))).toBe(true)
  })

  it('should require feedId', () => {
    expect(validateTrackEventRequest(makeTrackRequest({ feedId: '' }))).toContain('feedId required')
  })
})

// ─── Mappers ───

describe('IPCMappers', () => {
  it('should map request to DTO', () => {
    const req = makeGenerateRequest({ feedType: 'trending', sourceMediaId: 'media-42' })
    const dto = mapRequestToDto(req)
    expect(dto.userId).toBe('u1')
    expect(dto.feedType).toBe('trending')
    expect(dto.metadata?.sourceMediaId).toBe('media-42')
  })

  it('should map response to IPC', () => {
    const dto = { requestId: 'r1', feed: {} as any, generatedAt: 500, duration: 100, cacheHit: true }
    const ipc = mapResponseToIPC(dto)
    expect(ipc.requestId).toBe('r1')
    expect(ipc.cacheHit).toBe(true)
    expect(ipc.version).toBe(1)
  })
})

// ─── Errors ───

describe('IPCErrors', () => {
  it('should create validation error', () => {
    const err = new IPCValidationError(['field required'])
    expect(err.code).toBe('VALIDATION_ERROR')
    expect(err.safeMessage).toContain('field required')
  })

  it('should create transport error', () => {
    const err = new IPCTransportError('connection lost')
    expect(err.code).toBe('TRANSPORT_ERROR')
  })

  it('should create timeout error', () => {
    const err = new IPCTimeoutError('recommendation:generate', 5000)
    expect(err.code).toBe('TIMEOUT_ERROR')
  })

  it('toSafeError should map unknown errors', () => {
    const err = toSafeError(new Error('internal'))
    expect(err).toBeInstanceOf(RecommendationIPCError)
    expect(err.code).toBe('INTERNAL_ERROR')
  })

  it('toSafeError should pass through IPC errors', () => {
    const original = new IPCValidationError(['e'])
    expect(toSafeError(original)).toBe(original)
  })

  it('toResponse should serialize error', () => {
    const err = new RecommendationIPCError('CODE', 'safe message')
    const resp = err.toResponse()
    expect(resp.code).toBe('CODE')
    expect(resp.message).toBe('safe message')
  })
})

// ─── Events ───

describe('IPCEvents', () => {
  it('should define all event types', () => {
    expect(IPCEventTypes.FEED_GENERATED).toBe('recommendation:feed-generated')
    expect(IPCEventTypes.FEED_REFRESHED).toBe('recommendation:feed-refreshed')
    expect(IPCEventTypes.RECOMMENDATION_CLICKED).toBe('recommendation:clicked')
    expect(IPCEventTypes.RECOMMENDATION_CONSUMED).toBe('recommendation:consumed')
    expect(IPCEventTypes.HEALTH_CHANGED).toBe('recommendation:health-changed')
  })
})

// ─── Handlers ───

describe('HealthHandler', () => {
  it('should return health status', async () => {
    const handler = new HealthHandler()
    const health = await handler.handle()
    expect(health.status).toBe('healthy')
    expect(health.version).toBe(1)
    expect(health.uptimeMs).toBeGreaterThanOrEqual(0)
  })
})

describe('MetricsHandler', () => {
  it('should return metrics', async () => {
    const handler = new MetricsHandler()
    const metrics = await handler.handle()
    expect(metrics.version).toBe(1)
    expect(metrics.requestsTotal).toBeDefined()
    expect(metrics.providers).toEqual([])
  })
})
