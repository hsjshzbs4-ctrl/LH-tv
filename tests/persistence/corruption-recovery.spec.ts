// tests/persistence/corruption-recovery.spec.ts — 数据损坏恢复验证
// 验证: 损坏数据 → 系统不崩溃 → 恢复默认状态
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { storageService } from '@/shared/storage/storage.service'

describe('Corruption Recovery', () => {
  beforeEach(() => {
    storageService.invalidate()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ==================== Case 01: 损坏 JSON → 不崩溃 ====================
  it('Case 01: should not crash on corrupted JSON', async () => {
    const app = (window as Record<string, unknown>).app as Record<string, Record<string, unknown>>
    const storageLoad = app.storageLoad as ReturnType<typeof vi.fn>
    storageLoad.mockReset()
    storageLoad.mockRejectedValue(new SyntaxError('Unexpected token'))

    const schema = await storageService.load()
    expect(schema).toBeDefined()
    expect(schema.favorites).toEqual([])
    expect(schema.history).toEqual([])
    expect(storageService.isLoaded).toBe(true)
  })

  // ==================== Case 02: 空数据 → 默认状态 ====================
  it('Case 02: should restore default state from empty data', async () => {
    const app = (window as Record<string, unknown>).app as Record<string, Record<string, unknown>>
    const storageLoad = app.storageLoad as ReturnType<typeof vi.fn>
    storageLoad.mockReset()
    storageLoad.mockResolvedValue(null)

    const schema = await storageService.load()
    expect(schema.favorites).toEqual([])
    expect(schema.history).toEqual([])
    expect(schema.settings).toEqual({})
  })

  // ==================== Case 03: 字段缺失 → 自动补默认值 ====================
  it('Case 03: should auto-fill missing fields with defaults', async () => {
    const app = (window as Record<string, unknown>).app as Record<string, Record<string, unknown>>
    const storageLoad = app.storageLoad as ReturnType<typeof vi.fn>
    storageLoad.mockReset()
    // 提供完整 favorites 和 history（两者都必须是数组才会被解析）
    storageLoad.mockResolvedValue({
      favorites: [{ id: 'f1', mediaId: 'm1', providerId: 'p1', title: 'Test', cover: '', favoritedAt: 1000 }],
      history: [],
      // playbackPositions, searchHistory, settings, offlineLibrary, downloadHistory 全缺
    })

    const schema = await storageService.load()
    expect(schema.favorites).toHaveLength(1)
    expect(schema.history).toEqual([])
    expect(schema.playbackPositions).toEqual({}) // 自动补默认
    expect(schema.offlineLibrary).toEqual([]) // 自动补默认
  })

  // ==================== Case 04: 旧版本数据 → 兼容迁移 ====================
  it('Case 04: should migrate old format favorites', async () => {
    const app = (window as Record<string, unknown>).app as Record<string, Record<string, unknown>>
    const storageLoad = app.storageLoad as ReturnType<typeof vi.fn>
    storageLoad.mockReset()
    storageLoad.mockResolvedValue({
      favorites: [{ id: 'old-1', name: 'Old Show', image: 'img.jpg', genres: 'Action', rating: 8, addedAt: 1000 }],
      history: [],
      playbackPositions: {},
      searchHistory: [],
      settings: {},
    })

    const schema = await storageService.load()
    expect(schema.favorites[0].title).toBe('Old Show')
    expect(schema.favorites[0].mediaId).toBe('old-1')
  })

  // ==================== Case 05: 未知字段 → 自动忽略 ====================
  it('Case 05: should ignore unknown fields', async () => {
    const app = (window as Record<string, unknown>).app as Record<string, Record<string, unknown>>
    const storageLoad = app.storageLoad as ReturnType<typeof vi.fn>
    storageLoad.mockReset()
    storageLoad.mockResolvedValue({
      favorites: [],
      history: [],
      playbackPositions: {},
      searchHistory: [],
      settings: {},
      unknownField: 'should be ignored',
      anotherUnknown: { nested: true },
    })

    const schema = await storageService.load()
    expect(schema).toBeDefined()
    expect(schema.favorites).toEqual([])
    // 不应因未知字段而崩溃
  })

  // ==================== 存储服务异常恢复 ====================
  it('should not crash when storageLoad throws network error', async () => {
    const app = (window as Record<string, unknown>).app as Record<string, Record<string, unknown>>
    const storageLoad = app.storageLoad as ReturnType<typeof vi.fn>
    storageLoad.mockReset()
    storageLoad.mockRejectedValue(new Error('ECONNREFUSED'))

    const schema = await storageService.load()
    expect(schema).toBeDefined()
    expect(storageService.isLoaded).toBe(true)
  })

  // ==================== 错误后仍可正常读写 ====================
  it('should work normally after error recovery', async () => {
    const app = (window as Record<string, unknown>).app as Record<string, Record<string, unknown>>

    // Step 1: 首次加载失败
    const storageLoad = app.storageLoad as ReturnType<typeof vi.fn>
    storageLoad.mockReset()
    storageLoad.mockRejectedValue(new Error('disk error'))
    await storageService.load()

    // Step 2: 后续写入应使用内存缓存
    const storageSave = app.storageSave as ReturnType<typeof vi.fn>
    storageSave.mockReset()
    storageSave.mockResolvedValue(true)

    await storageService.setFavorites([{ id: 'f1', mediaId: 'm1', providerId: 'p1', title: 'Test', cover: '', favoritedAt: Date.now() }])
    const favorites = await storageService.getFavorites()
    expect(favorites).toHaveLength(1)
  })
})
