// src/ai/tools/tools/SearchTool.ts — 搜索工具
// 通过 Facade 访问，不直接操作 Frozen Zone

import type { AITool, ToolResult, ToolSchema } from '../types/tool.types'

const schema: ToolSchema = {
  name: 'search',
  description: 'Search for TV shows, movies, and anime in the LH-TV library',
  parameters: {
    keyword: { type: 'string', description: 'Search keyword' },
    type: { type: 'string', description: 'Content type', enum: ['movie', 'tv', 'anime', 'all'], default: 'all' },
  },
  required: ['keyword'],
}

export class SearchTool implements AITool {
  readonly schema = schema

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const keyword = params.keyword as string
    // 通过 SearchFacade 调用 (Frozen Zone 外部接入)
    // 此处提供 stub，实际集成在 Phase 6 Bootstrap 中完成
    return {
      success: true,
      data: {
        results: [],
        query: keyword,
        message: 'SearchTool: Integration pending (Phase 6 Bootstrap)',
      },
      toolName: 'search',
      executionTimeMs: 0,
    }
  }
}
