// tests/unit/ai/ai-framework.spec.ts — S5-5 AI Framework 单元测试

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AIOrchestrator } from '@ai/orchestrator/AIOrchestrator'
import { PromptManager } from '@ai/prompt/PromptManager'
import { ConversationManager } from '@ai/conversation/ConversationManager'
import { MockAIProvider } from '@ai/provider/MockAIProvider'
import { AICapability } from '@ai/types/ai.types'

vi.mock('@platform/flags', () => ({
  featureFlagManager: { isEnabled: vi.fn().mockReturnValue(true) },
  FeatureState: { OFF: 'OFF', INTERNAL: 'INTERNAL', PUBLIC: 'PUBLIC' },
}))

// ── MockAIProvider ──

describe('MockAIProvider', () => {
  let provider: MockAIProvider

  beforeEach(() => {
    provider = new MockAIProvider()
  })

  it('initializes and becomes available', async () => {
    await provider.initialize({ provider: 'mock' })
    expect(provider.isAvailable()).toBe(true)
  })

  it('returns mock response for ask', async () => {
    await provider.initialize({ provider: 'mock' })
    const response = await provider.complete('这是一部好剧吗？', {
      currentMedia: { title: '测试剧集' },
    })
    expect(response.text).toContain('Mock AI')
    expect(response.capability).toBe(AICapability.ASK)
  })

  it('returns mock response for summarize', async () => {
    await provider.initialize({ provider: 'mock' })
    const response = await provider.complete('总结这部剧', {
      currentMedia: { title: '测试剧集' },
    })
    expect(response.capability).toBe(AICapability.SUMMARIZE)
  })

  it('returns mock response for suggest', async () => {
    await provider.initialize({ provider: 'mock' })
    const response = await provider.complete('推荐一些内容', {
      currentMedia: { title: '测试剧集' },
    })
    expect(response.capability).toBe(AICapability.SUGGEST)
  })
})

// ── PromptManager ──

describe('PromptManager', () => {
  const pm = new PromptManager()

  it('renders template with variables', () => {
    const result = pm.render('summary', {
      title: '进击的巨人',
      year: '2013',
      genre: '动作, 奇幻',
    })
    expect(result).toContain('进击的巨人')
    expect(result).toContain('2013')
    expect(result).toContain('动作, 奇幻')
  })

  it('throws for unknown template', () => {
    expect(() => pm.render('nonexistent', {})).toThrow('Unknown prompt template')
  })

  it('registers and uses custom template', () => {
    pm.registerTemplate({
      name: 'custom',
      capability: AICapability.ASK,
      template: 'Hello {{name}}!',
      variables: ['name'],
    })
    const result = pm.render('custom', { name: '小林' })
    expect(result).toBe('Hello 小林!')
  })
})

// ── ConversationManager ──

describe('ConversationManager', () => {
  let cm: ConversationManager

  beforeEach(() => {
    cm = new ConversationManager()
  })

  it('creates and switches threads', () => {
    const thread = cm.createThread('测试对话')
    expect(thread.messages).toHaveLength(0)
    expect(cm.getCurrentThread()!.id).toBe(thread.id)
  })

  it('sends and retrieves messages', () => {
    cm.createThread('Test')
    cm.sendMessage(null, 'user', 'Hello')
    cm.sendMessage(null, 'assistant', 'Hi there!')

    const history = cm.getHistory()
    expect(history).toHaveLength(2)
    expect(history[0].role).toBe('user')
    expect(history[1].role).toBe('assistant')
  })

  it('clears thread messages', () => {
    cm.createThread('Test')
    cm.sendMessage(null, 'user', 'msg1')
    cm.clearThread()
    expect(cm.getHistory()).toHaveLength(0)
  })
})

// ── AIOrchestrator ──

describe('AIOrchestrator', () => {
  let orchestrator: AIOrchestrator

  beforeEach(() => {
    orchestrator = new AIOrchestrator()
  })

  it('initializes with mock provider', async () => {
    await orchestrator.initialize({ provider: 'mock' })
    expect(orchestrator.isAvailable()).toBe(true)
  })

  it('throws when not initialized', async () => {
    await expect(orchestrator.ask('test')).rejects.toThrow('not initialized')
  })

  it('asks questions', async () => {
    await orchestrator.initialize({ provider: 'mock' })
    const response = await orchestrator.ask('这个好看吗？', {
      currentMedia: { title: '测试剧集', episode: 'E01', genre: ['动画'] },
    })
    expect(response.text).toBeDefined()
    expect(response.capability).toBe(AICapability.ASK)
  })

  it('summarizes media', async () => {
    await orchestrator.initialize({ provider: 'mock' })
    const response = await orchestrator.summarize('进击的巨人', 2013, ['动作'])
    expect(response.capability).toBe(AICapability.SUMMARIZE)
  })
})
