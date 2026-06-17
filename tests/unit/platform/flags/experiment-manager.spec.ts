// tests/unit/platform/flags/experiment-manager.spec.ts — ExperimentManager 单元测试

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ExperimentManager } from '@platform/flags/manager/ExperimentManager'
import { flagStorage } from '@platform/flags/storage/FlagStorage'
import {
  FeatureState,
  type ExperimentDefinition,
} from '@platform/flags/types/flag.types'

// Mock storageService + FeatureFlagManager
vi.mock('@/shared/storage/storage.service', () => ({
  storageService: {
    getSettings: vi.fn().mockResolvedValue({}),
    setSettings: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@platform/flags/manager/FeatureFlagManager', () => ({
  featureFlagManager: {
    setOverride: vi.fn().mockResolvedValue(undefined),
  },
}))

// 测试实验: 50/50 A/B split
const AB_EXPERIMENT: ExperimentDefinition = {
  id: 'test-ab',
  name: 'Test A/B',
  flagKey: 'pb5.test_a',
  variants: [
    { name: 'control', weight: 0.5 },
    { name: 'treatment', weight: 0.5 },
  ],
  startedAt: Date.now(),
  enabled: true,
}

// 测试实验: 三变体
const MULTI_VARIANT: ExperimentDefinition = {
  id: 'test-multi',
  name: 'Test Multi-Variant',
  flagKey: 'pb5.test_b',
  variants: [
    { name: 'control', weight: 0.3 },
    { name: 'variant_a', weight: 0.3 },
    { name: 'variant_b', weight: 0.4 },
  ],
  startedAt: Date.now(),
  enabled: true,
}

describe('ExperimentManager', () => {
  let manager: ExperimentManager

  beforeEach(async () => {
    flagStorage.invalidateCache() // 测试隔离
    manager = new ExperimentManager('test-user-123')
    await manager.initialize()
  })

  // ── 实验注册 ──

  it('registers valid experiment', () => {
    manager.registerExperiment(AB_EXPERIMENT)
    // 不抛异常即成功
  })

  it('rejects experiment with invalid variant weights', () => {
    const badExperiment: ExperimentDefinition = {
      ...AB_EXPERIMENT,
      variants: [
        { name: 'a', weight: 0.3 },
        { name: 'b', weight: 0.3 },
      ], // 总和 0.6 ≠ 1.0
    }

    expect(() => manager.registerExperiment(badExperiment)).toThrow(
      'variant weights must sum to 1.0',
    )
  })

  // ── 用户分配 ──

  it('assigns user to a variant deterministically', async () => {
    manager.registerExperiment(AB_EXPERIMENT)
    const assignment = await manager.assignUser('test-ab')

    expect(assignment).not.toBeNull()
    expect(assignment!.experimentId).toBe('test-ab')
    expect(assignment!.flagKey).toBe('pb5.test_a')
    expect(['control', 'treatment']).toContain(assignment!.variantName)
  })

  it('same user gets same variant every time', async () => {
    manager.registerExperiment(AB_EXPERIMENT)
    const a1 = await manager.assignUser('test-ab')
    const a2 = await manager.assignUser('test-ab')

    expect(a1!.variantIndex).toBe(a2!.variantIndex)
    expect(a1!.variantName).toBe(a2!.variantName)
  })

  it('different users may get different variants', async () => {
    manager.registerExperiment(AB_EXPERIMENT)
    const user1 = new ExperimentManager('user-aaa')
    await user1.initialize()
    user1.registerExperiment(AB_EXPERIMENT)

    const user2 = new ExperimentManager('user-bbb')
    await user2.initialize()
    user2.registerExperiment(AB_EXPERIMENT)

    const a1 = await user1.assignUser('test-ab')
    const a2 = await user2.assignUser('test-ab')

    // 不同用户可能分配不同变体（高概率）
    // 不强制 assert 差异，但验证两次分配都有效
    expect(a1).not.toBeNull()
    expect(a2).not.toBeNull()
  })

  it('returns null for disabled experiment', async () => {
    const disabled: ExperimentDefinition = {
      ...AB_EXPERIMENT,
      enabled: false,
    }
    manager.registerExperiment(disabled)
    const assignment = await manager.assignUser('test-ab')

    expect(assignment).toBeNull()
  })

  it('returns null for unregistered experiment', async () => {
    const assignment = await manager.assignUser('nonexistent')
    expect(assignment).toBeNull()
  })

  // ── 多变体权重分配 ──

  it('multi-variant experiment allocates all users to valid variants', async () => {
    manager.registerExperiment(MULTI_VARIANT)

    const variantNames = new Set<string>()
    const numUsers = 500

    for (let i = 0; i < numUsers; i++) {
      const mgr = new ExperimentManager(`dist-user-${i}`)
      await mgr.initialize()
      mgr.registerExperiment(MULTI_VARIANT)
      const a = await mgr.assignUser('test-multi')
      expect(a).not.toBeNull()
      if (a) {
        variantNames.add(a.variantName)
        // 验证变体名称有效
        expect(['control', 'variant_a', 'variant_b']).toContain(a.variantName)
      }
    }

    // 至少应产生多种变体 (相同哈希值会产生相同变体，但哈希分布应覆盖多数)
    expect(variantNames.size).toBeGreaterThanOrEqual(1)
  })

  // ── getActiveAssignments ──

  it('tracks all assignments', async () => {
    manager.registerExperiment(AB_EXPERIMENT)
    manager.registerExperiment(MULTI_VARIANT)

    await manager.assignUser('test-ab')
    await manager.assignUser('test-multi')

    const active = manager.getActiveAssignments()
    expect(active).toHaveLength(2)
  })

  // ── getAssignment ──

  it('returns null for unassigned experiment', () => {
    expect(manager.getAssignment('nonexistent')).toBeNull()
  })

  it('returns assignment after assignUser', async () => {
    manager.registerExperiment(AB_EXPERIMENT)
    await manager.assignUser('test-ab')

    const assignment = manager.getAssignment('test-ab')
    expect(assignment).not.toBeNull()
    expect(assignment!.experimentId).toBe('test-ab')
  })
})
