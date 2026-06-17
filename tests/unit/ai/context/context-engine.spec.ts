// tests/unit/ai/context/context-engine.spec.ts — ContextEngine 测试

import { describe, it, expect, vi } from 'vitest'

vi.mock('@/shared/storage/storage.service', () => ({
  storageService: {
    getSettings: vi.fn().mockResolvedValue({}),
    setSettings: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@platform/flags', () => ({
  featureFlagManager: { isEnabled: vi.fn().mockReturnValue(false) },
  FeatureState: { OFF: 'OFF', INTERNAL: 'INTERNAL', PUBLIC: 'PUBLIC' },
}))

import { ContextEngine } from '@ai/context/ContextEngine'

describe('ContextEngine', () => {
  const engine = new ContextEngine()

  it('assembles rich AI context', async () => {
    const ctx = await engine.assemble()
    expect(ctx.device).toBeDefined()
    expect(ctx.device!.platform).toBe('electron')
    expect(ctx.device!.aiEnabled).toBe(true)
    expect(ctx.platform).toBeDefined()
  })

  it('builds system prompt', () => {
    const prompt = engine.buildSystemPrompt()
    expect(prompt).toContain('LH-TV')
    expect(prompt).toContain('AI Assistant')
  })
})
