// tests/unit/ai/memory/memory-store.spec.ts — MemoryStore + RetentionPolicy 测试

import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/shared/storage/storage.service', () => ({
  storageService: {
    getSettings: vi.fn().mockResolvedValue({}),
    setSettings: vi.fn().mockResolvedValue(undefined),
  },
}))

import { MemoryStore } from '@ai/memory/store/MemoryStore'
import { MemoryEntryType } from '@ai/governance/MemoryRetentionPolicy'

describe('MemoryStore', () => {
  let store: MemoryStore

  beforeEach(async () => {
    store = new MemoryStore()
    await store.initialize()
  })

  it('stores allowed memory types', async () => {
    const id = await store.store(
      MemoryEntryType.CONVERSATION_SUMMARY,
      JSON.stringify({ threadId: 't1', summary: 'User watched 3 episodes' }),
      { threadId: 't1' },
    )
    expect(id).toBeTruthy()
    expect(id).toContain('mem_')
  })

  it('stores user preferences', async () => {
    const id = await store.store(
      MemoryEntryType.USER_PREFERENCE,
      JSON.stringify({ key: 'genre', value: 'action', confidence: 0.9 }),
      { preferenceKey: 'genre' },
    )
    expect(id).toBeTruthy()
  })

  it('stores tool result snapshots', async () => {
    const id = await store.store(
      MemoryEntryType.TOOL_RESULT_SNAPSHOT,
      JSON.stringify({ toolName: 'search', result: '5 results' }),
      { toolName: 'search' },
    )
    expect(id).toBeTruthy()
  })

  it('rejects forbidden memory types (full prompt)', async () => {
    await expect(
      store.store(MemoryEntryType.FULL_PROMPT_ARCHIVE, 'user: tell me about...'),
    ).rejects.toThrow('forbidden')
  })

  it('rejects forbidden memory types (full response)', async () => {
    await expect(
      store.store(MemoryEntryType.FULL_MODEL_RESPONSE, 'AI: here is the answer...'),
    ).rejects.toThrow('forbidden')
  })

  it('queries by type', async () => {
    await store.store(MemoryEntryType.CONVERSATION_SUMMARY, '{"t":"1"}')
    await store.store(MemoryEntryType.USER_PREFERENCE, '{"k":"v"}')

    const summaries = store.query(MemoryEntryType.CONVERSATION_SUMMARY)
    expect(summaries).toHaveLength(1)
  })

  it('deletes entries', async () => {
    const id = await store.store(MemoryEntryType.USER_PREFERENCE, 'test')
    expect(await store.delete(id)).toBe(true)
    expect(await store.delete(id)).toBe(false)
  })

  it('prunes expired entries', async () => {
    const count = await store.pruneExpired()
    expect(typeof count).toBe('number')
  })
})
