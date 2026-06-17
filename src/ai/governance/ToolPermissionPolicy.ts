// src/ai/governance/ToolPermissionPolicy.ts — 工具权限策略
// PB6 Governance: 控制哪些 Tool 可被 AI 调用，危险工具需要用户确认

/** 工具权限级别 */
export enum ToolPermissionLevel {
  /** 安全：AI 可自动调用 */
  SAFE = 'safe',
  /** 需确认：调用前需用户确认 */
  CONFIRM = 'confirm',
  /** 禁止：AI 不可调用此工具 */
  FORBIDDEN = 'forbidden',
}

/** 工具权限规则 */
export interface ToolPermissionRule {
  toolName: string
  level: ToolPermissionLevel
  description: string
  reason?: string
}

/** 内置工具权限规则表 */
const BUILTIN_RULES: ToolPermissionRule[] = [
  {
    toolName: 'search',
    level: ToolPermissionLevel.SAFE,
    description: 'Content search — read-only, no side effects',
  },
  {
    toolName: 'recommend',
    level: ToolPermissionLevel.SAFE,
    description: 'Content recommendation — read-only',
  },
  {
    toolName: 'summarize',
    level: ToolPermissionLevel.SAFE,
    description: 'Episode/media summary — read-only',
  },
  {
    toolName: 'playback_info',
    level: ToolPermissionLevel.SAFE,
    description: 'Get current playback info — read-only',
  },
  {
    toolName: 'playback_control',
    level: ToolPermissionLevel.CONFIRM,
    description: 'Play/pause/seek/switch episode — has side effects',
    reason: 'Playback control affects user experience directly',
  },
  {
    toolName: 'settings_read',
    level: ToolPermissionLevel.SAFE,
    description: 'Read user settings — read-only',
  },
  {
    toolName: 'settings_write',
    level: ToolPermissionLevel.CONFIRM,
    description: 'Modify user settings — has side effects',
    reason: 'Setting changes may affect app behavior',
  },
  {
    toolName: 'system_info',
    level: ToolPermissionLevel.SAFE,
    description: 'Get system information — read-only',
  },
  {
    toolName: 'file_access',
    level: ToolPermissionLevel.FORBIDDEN,
    description: 'File system access — forbidden for AI',
    reason: 'Security boundary: AI must not access filesystem',
  },
]

export class ToolPermissionPolicy {
  private rules = new Map<string, ToolPermissionRule>()

  constructor() {
    for (const rule of BUILTIN_RULES) {
      this.rules.set(rule.toolName, rule)
    }
  }

  /** 检查工具是否可被 AI 调用 */
  check(toolName: string): ToolPermissionRule {
    const rule = this.rules.get(toolName)
    if (!rule) {
      // 未知工具默认禁止
      return {
        toolName,
        level: ToolPermissionLevel.FORBIDDEN,
        description: `Unknown tool: ${toolName}`,
        reason: 'Tools must be explicitly registered and have a permission rule',
      }
    }
    return rule
  }

  /** 工具是否需要用户确认 */
  requiresConfirmation(toolName: string): boolean {
    return this.check(toolName).level === ToolPermissionLevel.CONFIRM
  }

  /** 工具是否完全禁止 */
  isForbidden(toolName: string): boolean {
    return this.check(toolName).level === ToolPermissionLevel.FORBIDDEN
  }

  /** 注册新工具权限规则 */
  registerRule(rule: ToolPermissionRule): void {
    this.rules.set(rule.toolName, rule)
  }

  /** 获取所有规则 */
  getAllRules(): ToolPermissionRule[] {
    return Array.from(this.rules.values())
  }
}

export const toolPermissionPolicy = new ToolPermissionPolicy()
