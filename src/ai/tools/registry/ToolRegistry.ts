// src/ai/tools/registry/ToolRegistry.ts — 统一工具注册表

import type { AITool, ToolSchema } from '../types/tool.types'
import { toolPermissionPolicy } from '../../governance/ToolPermissionPolicy'

export class ToolRegistry {
  private tools = new Map<string, AITool>()

  /** 注册工具 (需通过 ToolPermissionPolicy) */
  register(tool: AITool): void {
    const permission = toolPermissionPolicy.check(tool.schema.name)
    if (permission.level === 'forbidden') {
      throw new Error(`Tool "${tool.schema.name}" is forbidden: ${permission.reason}`)
    }
    this.tools.set(tool.schema.name, tool)
  }

  /** 获取工具 */
  get(name: string): AITool | null {
    return this.tools.get(name) ?? null
  }

  /** 获取所有已注册工具 */
  list(): AITool[] {
    return Array.from(this.tools.values())
  }

  /** 获取所有工具的 Schema (供 AI 模型使用) */
  getSchemas(): ToolSchema[] {
    return this.list().map((t) => t.schema)
  }

  /** 工具是否需要确认 */
  requiresConfirmation(toolName: string): boolean {
    return toolPermissionPolicy.requiresConfirmation(toolName)
  }
}

export const toolRegistry = new ToolRegistry()
