// src/platform/flags/manager/ExperimentManager.ts — A/B 实验管理
// 确定性哈希分配，确保同一用户始终分配到同一变体

import { FeatureState } from '../types/flag.types'
import type {
  ExperimentDefinition,
  ExperimentVariant,
  ExperimentAssignment,
} from '../types/flag.types'
import { flagStorage } from '../storage/FlagStorage'
import { featureFlagManager } from './FeatureFlagManager'

export class ExperimentManager {
  /** 所有已注册的实验 */
  private experiments = new Map<string, ExperimentDefinition>()
  /** 当前用户的实验分配 */
  private assignments = new Map<string, ExperimentAssignment>()
  /** 用户标识 (用于确定性分配) */
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  // ── 初始化 ──

  /** 从持久化加载实验分配 */
  async initialize(): Promise<void> {
    try {
      const persisted = await flagStorage.load()
      for (const assignment of persisted.assignments) {
        this.assignments.set(assignment.experimentId, assignment)
      }
    } catch {
      // 无持久化数据
    }
  }

  // ── 实验注册 ──

  /**
   * 注册一个实验
   * 验证变体权重总和 = 1
   */
  registerExperiment(experiment: ExperimentDefinition): void {
    // 验证权重
    const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0)
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      throw new Error(
        `Experiment ${experiment.id}: variant weights must sum to 1.0, got ${totalWeight}`,
      )
    }

    this.experiments.set(experiment.id, experiment)
  }

  // ── 用户分配 ──

  /**
   * 为用户分配实验变体 (确定性哈希)
   * 同一用户 + 同一实验 始终得到同一变体
   * 使用实验 ID 哈希作为种子确保分配不被时间影响
   */
  async assignUser(experimentId: string): Promise<ExperimentAssignment | null> {
    // 检查是否已分配
    const existing = this.assignments.get(experimentId)
    if (existing) return existing

    const experiment = this.experiments.get(experimentId)
    if (!experiment || !experiment.enabled) return null

    // 确定性分配: hash(userId + experimentId) → variant
    const hash = this.deterministicHash(this.userId + experimentId)
    const variant = this.selectVariant(experiment.variants, hash)

    const assignment: ExperimentAssignment = {
      experimentId,
      flagKey: experiment.flagKey,
      variantIndex: experiment.variants.indexOf(variant),
      variantName: variant.name,
      assignedAt: Date.now(),
    }

    this.assignments.set(experimentId, assignment)

    // 应用变体的 flag 覆盖
    if (variant.flagOverrides) {
      for (const [flagKey, state] of Object.entries(variant.flagOverrides)) {
        if (state != null && state !== FeatureState.OFF) {
          try {
            await featureFlagManager.setOverride(flagKey, state, `experiment:${experimentId}`)
          } catch {
            // 覆盖失败不阻断分配
          }
        }
      }
    }

    // 持久化
    await this._persistAssignments()

    return assignment
  }

  /**
   * 记录实验曝光 (用户实际看到了实验变体)
   */
  async recordExposure(experimentId: string): Promise<void> {
    const assignment = this.assignments.get(experimentId)
    if (!assignment) return
    // 曝光计数在 S5-6 DataPipeline 中实现
    // 这里仅验证分配存在
  }

  /** 获取用户的所有实验分配 */
  getActiveAssignments(): ExperimentAssignment[] {
    return Array.from(this.assignments.values())
  }

  /** 获取用户在特定实验的变体 */
  getAssignment(experimentId: string): ExperimentAssignment | null {
    return this.assignments.get(experimentId) ?? null
  }

  // ── 内部方法 ──

  /**
   * 确定性哈希: djb2 算法变体
   * 确保同一输入始终产生同一输出 (不依赖随机数)
   */
  private deterministicHash(input: string): number {
    let hash = 5381
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) + hash + input.charCodeAt(i)) & 0xffffffff
    }
    // 归一化到 0~1
    return (hash >>> 0) / 0xffffffff
  }

  /**
   * 根据哈希值选择变体
   * 按权重累积分布选择
   */
  private selectVariant(variants: ExperimentVariant[], hash: number): ExperimentVariant {
    let cumulative = 0
    for (const variant of variants) {
      cumulative += variant.weight
      if (hash <= cumulative) return variant
    }
    // 浮点精度保护：返回最后一个变体
    return variants[variants.length - 1]
  }

  /** 持久化所有分配 */
  private async _persistAssignments(): Promise<void> {
    await flagStorage.saveAssignments(Array.from(this.assignments.values()))
  }
}
