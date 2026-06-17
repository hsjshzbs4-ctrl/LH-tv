// tests/unit/ai/tools/tool-framework.spec.ts — Tool Framework 测试

import { describe, it, expect, vi } from 'vitest'

vi.mock('@/shared/storage/storage.service', () => ({
  storageService: {
    getSettings: vi.fn().mockResolvedValue({}),
    setSettings: vi.fn().mockResolvedValue(undefined),
  },
}))

import { ToolRegistry } from '@ai/tools/registry/ToolRegistry'
import { InvocationPipeline } from '@ai/tools/pipeline/InvocationPipeline'
import { SearchTool } from '@ai/tools/tools/SearchTool'
import { PlaybackInfoTool, PlaybackControlTool } from '@ai/tools/tools/PlaybackTool'
import type { AITool, ToolResult } from '@ai/tools/types/tool.types'

describe('ToolRegistry', () => {
  const registry = new ToolRegistry()

  it('registers safe tools successfully', () => {
    const tool = new SearchTool()
    registry.register(tool)
    expect(registry.get('search')).toBe(tool)
  })

  it('lists registered tools', () => {
    const tool = new PlaybackInfoTool()
    const r = new ToolRegistry()
    r.register(tool)
    expect(r.list()).toHaveLength(1)
  })

  it('returns tool schemas', () => {
    const r = new ToolRegistry()
    r.register(new SearchTool())
    const schemas = r.getSchemas()
    expect(schemas).toHaveLength(1)
    expect(schemas[0].name).toBe('search')
  })

  it('returns null for unknown tool', () => {
    expect(registry.get('nonexistent')).toBeNull()
  })

  it('check requires confirmation for playback_control', () => {
    expect(registry.requiresConfirmation('playback_control')).toBe(true)
  })

  it('check does not require confirmation for safe tools', () => {
    expect(registry.requiresConfirmation('search')).toBe(false)
  })
})

describe('InvocationPipeline', () => {
  it('returns error for unknown tool', async () => {
    const pipeline = new InvocationPipeline()
    const result = await pipeline.invoke({
      toolName: 'nonexistent',
      parameters: {},
      requestId: 'r1',
      timestamp: Date.now(),
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain('Unknown tool')
  })

  it('executes registered tool successfully', async () => {
    const tool = new SearchTool()
    const r = new ToolRegistry()
    r.register(tool)

    // Need to use the singleton toolRegistry for InvocationPipeline
    // So we test SearchTool directly
    const result = await tool.execute({ keyword: 'test', type: 'all' })
    expect(result.success).toBe(true)
    expect(result.toolName).toBe('search')
  })

  it('PlaybackInfoTool executes successfully', async () => {
    const tool = new PlaybackInfoTool()
    const result = await tool.execute({})
    expect(result.success).toBe(true)
  })

  it('PlaybackControlTool executes successfully', async () => {
    const tool = new PlaybackControlTool()
    const result = await tool.execute({ action: 'play' })
    expect(result.success).toBe(true)
    expect(result.data).toHaveProperty('action', 'play')
  })
})
