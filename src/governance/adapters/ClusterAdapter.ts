// src/governance/adapters/ClusterAdapter.ts — PB8 集群适配器 (Stateless Stub)
import type { ClusterAdapter as IClusterAdapter } from '../contracts'
export const ClusterAdapter: IClusterAdapter = {
  join: async () => true,
  leave: async () => {},
  elect: async () => 'node-1',
  health: async () => ({ all: true }),
}
