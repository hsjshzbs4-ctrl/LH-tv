// src/governance/adapters/CloudAdapter.ts — PB8 Cloud 云适配器 (Stateless Stub)
import type { CloudAdapter as ICloudAdapter } from '../contracts'
export const CloudAdapter: ICloudAdapter = {
  connect: async () => true,
  disconnect: async () => {},
  sync: async (data) => data,
  push: async () => true,
  pull: async (query) => query,
}
