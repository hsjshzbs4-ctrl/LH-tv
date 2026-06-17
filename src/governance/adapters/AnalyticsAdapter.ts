// src/governance/adapters/AnalyticsAdapter.ts — PB8 分析适配器 (Stateless Stub)
import type { AnalyticsAdapter as IAnalyticsAdapter } from '../contracts'
export const AnalyticsAdapter: IAnalyticsAdapter = {
  collect: () => {},
  aggregate: async (pipeline) => pipeline,
  analyze: async (query) => ({}),
  predict: async (_model, input) => input,
}
