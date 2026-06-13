// src/core/aggregation/ranking/ProviderRanker.ts - Provider 排序器
// P4.1 Multi-Source Aggregation Engine
//
// 加权评分：Priority(50%) + SuccessRate(30%) + ResponseTime(20%)
// 输入 Provider 元数据 + 统计数据 → 输出排序后的 Provider ID 列表
//
// 职责：排序计算、权重管理
// 禁止：UI、健康检查、Provider 调用

import type { ProviderScore } from '../types/aggregation.types'

/** 默认权重 */
const DEFAULT_WEIGHTS = {
  priority: 0.5,
  successRate: 0.3,
  responseTime: 0.2,
}

export class ProviderRanker {
  private weights = { ...DEFAULT_WEIGHTS }

  /**
   * 对 Provider 进行加权排名
   * @param scores Provider 评分数据
   * @returns 按综合得分降序排列的 providerId 列表
   */
  rank(scores: ProviderScore[]): string[] {
    if (scores.length === 0) return []

    // 归一化各维度
    const maxPriority = Math.max(1, ...scores.map((s) => s.priority))
    const maxResponseTime = Math.max(1, ...scores.map((s) => s.responseTime))

    // 计算综合得分
    const ranked = scores.map((s) => {
      // Priority 归一化（越高越好）
      const priorityNorm = s.priority / maxPriority
      // SuccessRate 已是 0-1 范围
      const successRateNorm = s.successRate
      // ResponseTime 归一化（越低越好 → 取反）
      const responseTimeNorm = 1 - (s.responseTime / maxResponseTime)

      const score =
        this.weights.priority * priorityNorm +
        this.weights.successRate * successRateNorm +
        this.weights.responseTime * responseTimeNorm

      return { providerId: s.providerId, score }
    })

    // 按得分降序排列
    ranked.sort((a, b) => b.score - a.score)
    return ranked.map((r) => r.providerId)
  }

  /**
   * 更新权重（用于 A/B 测试或动态调优）
   */
  setWeights(weights: Partial<typeof DEFAULT_WEIGHTS>): void {
    const total = (weights.priority ?? this.weights.priority) +
      (weights.successRate ?? this.weights.successRate) +
      (weights.responseTime ?? this.weights.responseTime)
    this.weights = {
      priority: (weights.priority ?? this.weights.priority) / total,
      successRate: (weights.successRate ?? this.weights.successRate) / total,
      responseTime: (weights.responseTime ?? this.weights.responseTime) / total,
    }
  }

  /** 获取当前权重 */
  getWeights(): Readonly<typeof DEFAULT_WEIGHTS> {
    return { ...this.weights }
  }
}
