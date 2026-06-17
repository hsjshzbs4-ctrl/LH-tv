// src/ai/tools/pipeline/InvocationPipeline.ts — 工具调用管线
// validate → authorize → execute → format

import type { AITool, ToolInvocation, ToolResult } from '../types/tool.types'
import { toolRegistry } from '../registry/ToolRegistry'
import { toolPermissionPolicy } from '../../governance/ToolPermissionPolicy'
import { sessionMemory } from '../../memory/store/SessionMemory'

export class InvocationPipeline {
  /**
   * 执行工具调用
   * 调用链: validate → authorize → execute → snapshot → format
   */
  async invoke(invocation: ToolInvocation): Promise<ToolResult> {
    const startTime = performance.now()

    // 1. validate: 工具是否存在
    const tool = toolRegistry.get(invocation.toolName)
    if (!tool) {
      return {
        success: false,
        error: `Unknown tool: ${invocation.toolName}`,
        toolName: invocation.toolName,
        data: null,
        executionTimeMs: 0,
      }
    }

    // 2. authorize: 权限检查
    const permission = toolPermissionPolicy.check(invocation.toolName)
    if (permission.level === 'forbidden') {
      return {
        success: false,
        error: `Tool forbidden: ${permission.reason}`,
        toolName: invocation.toolName,
        data: null,
        executionTimeMs: 0,
      }
    }

    // 3. execute
    let result: ToolResult
    try {
      result = await tool.execute(invocation.parameters)
    } catch (err) {
      result = {
        success: false,
        error: String(err),
        toolName: invocation.toolName,
        data: null,
        executionTimeMs: performance.now() - startTime,
      }
    }

    // 4. snapshot: 保存工具结果快照 (允许 by MemoryRetentionPolicy)
    try {
      await sessionMemory.saveToolResult(
        invocation.toolName,
        JSON.stringify(result.success ? result.data : result.error),
      )
    } catch {
      // snapshot 失败不影响工具调用
    }

    return result
  }
}

export const invocationPipeline = new InvocationPipeline()
