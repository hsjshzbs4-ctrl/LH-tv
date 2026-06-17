// tests/unit/platform/flags/flag-storage.spec.ts — FlagStorage 单元测试

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FlagStorage } from '@platform/flags/storage/FlagStorage'
import type { FlagOverride, ExperimentAssignment } from '@platform/flags/types/flag.types'
import { FeatureState } from '@platform/flags/types/flag.types'

// Mock storageService
const mockGetSettings = vi.fn()
const mockSetSettings = vi.fn()

vi.mock('@/shared/storage/storage.service', () => ({
  storageService: {
    getSettings: () => mockGetSettings(),
    setSettings: (s: Record<string, unknown>) => mockSetSettings(s),
  },
}))

function makeOverride(key: string, state = FeatureState.PUBLIC): FlagOverride {
  return {
    flagKey: key,
    state,
    reason: 'test',
    setAt: Date.now(),
  }
}

function makeAssignment(experimentId: string, flagKey = 'pb5.test'): ExperimentAssignment {
  return {
    experimentId,
    flagKey,
    variantIndex: 0,
    variantName: 'control',
    assignedAt: Date.now(),
  }
}

describe('FlagStorage', () => {
  let storage: FlagStorage

  beforeEach(() => {
    storage = new FlagStorage()
    mockGetSettings.mockReset()
    mockSetSettings.mockReset()
  })

  // ── load ──

  it('loads empty data when no persisted data exists', async () => {
    mockGetSettings.mockResolvedValue({})

    const data = await storage.load()
    expect(data.overrides).toEqual([])
    expect(data.assignments).toEqual([])
  })

  it('loads persisted overrides', async () => {
    const overrides = [makeOverride('pb5.test_a')]
    mockGetSettings.mockResolvedValue({
      pb5_feature_flags: JSON.stringify({ overrides, assignments: [], updatedAt: Date.now() }),
    })

    const data = await storage.load()
    expect(data.overrides).toHaveLength(1)
    expect(data.overrides[0].flagKey).toBe('pb5.test_a')
  })

  it('loads persisted assignments', async () => {
    const assignments = [makeAssignment('test-ab')]
    mockGetSettings.mockResolvedValue({
      pb5_feature_flags: JSON.stringify({ overrides: [], assignments, updatedAt: Date.now() }),
    })

    const data = await storage.load()
    expect(data.assignments).toHaveLength(1)
    expect(data.assignments[0].experimentId).toBe('test-ab')
  })

  it('caches loaded data', async () => {
    mockGetSettings.mockResolvedValue({})

    await storage.load()
    await storage.load()
    // getSettings 应只调用一次
    expect(mockGetSettings).toHaveBeenCalledTimes(1)
  })

  // ── saveOverrides ──

  it('persists overrides', async () => {
    mockGetSettings.mockResolvedValue({})

    const overrides = [makeOverride('pb5.test_a')]
    await storage.saveOverrides(overrides)

    expect(mockSetSettings).toHaveBeenCalledTimes(1)
    const saved = mockSetSettings.mock.calls[0][0]
    expect(saved).toHaveProperty('pb5_feature_flags')

    // 验证保存的 JSON 包含正确数据
    const parsed = JSON.parse(saved.pb5_feature_flags)
    expect(parsed.overrides).toHaveLength(1)
  })

  // ── saveAssignments ──

  it('persists assignments', async () => {
    mockGetSettings.mockResolvedValue({})

    const assignments = [makeAssignment('test-ab')]
    await storage.saveAssignments(assignments)

    expect(mockSetSettings).toHaveBeenCalledTimes(1)
    const saved = mockSetSettings.mock.calls[0][0]
    const parsed = JSON.parse(saved.pb5_feature_flags)
    expect(parsed.assignments).toHaveLength(1)
  })

  // ── clear ──

  it('clears all persisted data', async () => {
    mockGetSettings.mockResolvedValue({})

    // 先保存一些数据
    await storage.saveOverrides([makeOverride('pb5.test_a')])
    await storage.saveAssignments([makeAssignment('test-ab')])

    // 清空
    await storage.clear()

    const data = await storage.load()
    expect(data.overrides).toEqual([])
    expect(data.assignments).toEqual([])
  })
})
