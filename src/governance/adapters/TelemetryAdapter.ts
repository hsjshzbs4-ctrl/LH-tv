// src/governance/adapters/TelemetryAdapter.ts — PB8 遥测适配器 (Stateless Stub)
import type { TelemetryAdapter as ITelemetryAdapter } from '../contracts'
export const TelemetryAdapter: ITelemetryAdapter = {
  track: () => {},
  metric: () => {},
  diagnose: async () => [],
  alert: () => {},
}
