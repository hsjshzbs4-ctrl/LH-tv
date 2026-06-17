// src/governance/adapters/SyncAdapter.ts — PB8 同步适配器 (Stateless Stub)
import type { SyncAdapter as ISyncAdapter } from '../contracts'
export const SyncAdapter: ISyncAdapter = {
  replicate: async () => true,
  conflict: async (_local, _remote) => ({}),
  merge: async (_base, _theirs, _mine) => ({}),
  resolve: async (conflict) => conflict,
}
