// src/ai/tools/tools/PlaybackTool.ts — 播放控制工具
// 只读: 获取播放状态 / 控制: 需用户确认

import type { AITool, ToolResult, ToolSchema } from '../types/tool.types'

const infoSchema: ToolSchema = {
  name: 'playback_info',
  description: 'Get current playback status (title, episode, progress, quality) — read-only',
  parameters: {},
  required: [],
}

const controlSchema: ToolSchema = {
  name: 'playback_control',
  description: 'Control playback (play/pause/seek/next episode) — requires user confirmation',
  parameters: {
    action: { type: 'string', description: 'Action', enum: ['play', 'pause', 'seek', 'next', 'previous'] },
    value: { type: 'number', description: 'Seek target in seconds (for seek action)' },
  },
  required: ['action'],
}

export class PlaybackInfoTool implements AITool {
  readonly schema = infoSchema
  async execute(_params: Record<string, unknown>): Promise<ToolResult> {
    // 通过 PlayerFacade 获取状态 (Phase 6 Bootstrap 集成)
    return {
      success: true,
      data: { state: 'playing', message: 'PlaybackTool: Integration pending (Phase 6)' },
      toolName: 'playback_info',
      executionTimeMs: 0,
    }
  }
}

export class PlaybackControlTool implements AITool {
  readonly schema = controlSchema
  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    // 通过 PlayerFacade 控制 (Phase 6 Bootstrap 集成)
    return {
      success: true,
      data: { action: params.action, message: 'PlaybackControl: Integration pending (Phase 6)' },
      toolName: 'playback_control',
      executionTimeMs: 0,
    }
  }
}
