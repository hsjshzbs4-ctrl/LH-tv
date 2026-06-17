// src/ai/tools/types/tool.types.ts — PB6 Tool Framework 类型

/** 工具 Schema */
export interface ToolSchema {
  name: string
  description: string
  parameters: Record<string, ToolParameter>
  required: string[]
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description: string
  enum?: string[]
  default?: unknown
}

/** 工具调用请求 */
export interface ToolInvocation {
  toolName: string
  parameters: Record<string, unknown>
  requestId: string
  timestamp: number
}

/** 工具调用结果 */
export interface ToolResult {
  success: boolean
  data: unknown
  error?: string
  toolName: string
  executionTimeMs: number
}

/** AI Tool 接口 */
export interface AITool {
  readonly schema: ToolSchema
  execute(params: Record<string, unknown>): Promise<ToolResult>
}
