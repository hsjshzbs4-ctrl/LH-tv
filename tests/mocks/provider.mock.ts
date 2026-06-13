// tests/mocks/provider.mock.ts — Provider Mock 工厂
// 创建可控的 IProvider 测试替身

import { vi } from 'vitest'
import type { IProvider, MediaItem, MediaDetail, MediaEpisode } from '@provider-contracts'
import type { ProviderMeta } from '@/core/providers/types/provider.types'

export interface MockProviderOptions {
  id?: string
  name?: string
  enabled?: boolean
  priority?: number
  /** 预设搜索结果 */
  searchResults?: MediaItem[]
  /** 预设详情结果 */
  detailResult?: MediaDetail
  /** healthCheck 返回值 */
  healthy?: boolean
  /** 是否让 search 抛出异常 */
  searchThrows?: boolean
  /** 是否让 detail 抛出异常 */
  detailThrows?: boolean
  /** 模拟延迟 (ms) */
  delay?: number
}

/**
 * createMockProvider — 创建可控的 IProvider 测试替身
 *
 * 所有方法都是 vi.fn()，可通过 mock 断言调用次数和参数。
 *
 * 用法：
 *   const p = createMockProvider({ id: 'test', searchResults: [...] })
 *   expect(p.search).toHaveBeenCalledWith('keyword')
 */
export function createMockProvider(opts: MockProviderOptions = {}): IProvider {
  const {
    id = 'mock-provider',
    name = 'Mock Provider',
    enabled = true,
    priority = 100,
    searchResults = [],
    detailResult,
    healthy = true,
    searchThrows = false,
    detailThrows = false,
    delay = 0,
  } = opts

  return {
    id,
    name,
    enabled,
    priority,

    search: vi.fn().mockImplementation(async (keyword: string): Promise<MediaItem[]> => {
      if (delay) await sleep(delay)
      if (searchThrows) throw new Error(`Provider "${id}" search error: ${keyword}`)
      return searchResults
    }),

    detail: vi.fn().mockImplementation(async (mediaId: string): Promise<MediaDetail> => {
      if (delay) await sleep(delay)
      if (detailThrows) throw new Error(`Provider "${id}" detail error: ${mediaId}`)
      return (
        detailResult || {
          id: mediaId,
          title: `${name} Detail`,
          cover: '',
          description: 'Mock detail',
          providerId: id,
          episodes: [],
        }
      )
    }),

    healthCheck: vi.fn().mockImplementation(async (): Promise<boolean> => {
      if (delay) await sleep(delay)
      return healthy
    }),
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ============================================================
// 预置 Mock Provider 工厂
// ============================================================

/** 创建标准 "健康" Provider */
export function createHealthyProvider(id = 'healthy-p1', priority = 100): IProvider {
  return createMockProvider({
    id,
    name: `Healthy ${id}`,
    priority,
    healthy: true,
    searchResults: [
      createMockMediaItem({ id: `${id}-1`, title: 'Test Show 1', providerId: id }),
      createMockMediaItem({ id: `${id}-2`, title: 'Test Show 2', providerId: id }),
    ],
  })
}

/** 创建 "故障" Provider（永远抛异常） */
export function createFailingProvider(id = 'failing-p1', priority = 200): IProvider {
  return createMockProvider({
    id,
    name: `Failing ${id}`,
    priority,
    healthy: false,
    searchThrows: true,
    detailThrows: true,
  })
}

// ============================================================
// 测试数据工厂（同步版本，用于快速构造）
// ============================================================

let _idCounter = 0
function uid(prefix = 'mock'): string {
  return `${prefix}_${++_idCounter}_${Date.now()}`
}

export function createMockMediaItem(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: uid('media'),
    title: 'Mock Media',
    cover: '',
    providerId: 'mock',
    providerName: 'Mock Provider',
    type: 'movie',
    ...overrides,
  }
}

export function createMockMediaDetail(overrides: Partial<MediaDetail> = {}): MediaDetail {
  return {
    id: uid('detail'),
    title: 'Mock Detail',
    cover: '',
    description: 'Mock description',
    providerId: 'mock',
    episodes: [],
    ...overrides,
  }
}

export function createMockEpisode(overrides: Partial<MediaEpisode> = {}): MediaEpisode {
  return {
    id: uid('ep'),
    title: 'Episode 1',
    episodeNumber: 1,
    ...overrides,
  }
}
