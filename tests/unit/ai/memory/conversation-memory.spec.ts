// tests/unit/ai/memory/conversation-memory.spec.ts — ConversationMemory 测试

import { describe, it, expect, vi } from 'vitest'

vi.mock('@/shared/storage/storage.service', () => ({
  storageService: {
    getSettings: vi.fn().mockResolvedValue({}),
    setSettings: vi.fn().mockResolvedValue(undefined),
  },
}))

import { ConversationMemory } from '@ai/memory/store/ConversationMemory'

describe('ConversationMemory', () => {
  const memory = new ConversationMemory()

  it('estimates tokens for Chinese text', () => {
    const tokens = ConversationMemory.estimateTokens('你好世界这是一个测试')
    expect(tokens).toBeGreaterThan(0)
  })

  it('estimates tokens for English text', () => {
    const tokens = ConversationMemory.estimateTokens('Hello world this is a test')
    expect(tokens).toBeGreaterThan(0)
  })

  it('estimates tokens for mixed text', () => {
    const tokens = ConversationMemory.estimateTokens('你好 Hello 世界 World')
    expect(tokens).toBeGreaterThan(0)
  })

  it('detects context window exceeded', () => {
    const long = '测试'.repeat(5000)
    expect(ConversationMemory.exceedsContextWindow(long, 8000)).toBe(true)
  })

  it('does not flag short text', () => {
    expect(ConversationMemory.exceedsContextWindow('short', 8000)).toBe(false)
  })

  it('truncates to token limit', () => {
    const text = '测试'.repeat(3000)
    const truncated = ConversationMemory.truncateToTokens(text, 2000)
    expect(truncated.length).toBeLessThan(text.length)
    expect(truncated.endsWith('...')).toBe(true)
  })
})
