// src/ai/governance/AIProviderPolicy.ts — Provider 治理策略
// PB6 Governance: 所有 Provider 必须通过 ModelGateway，禁止直接调用

import { featureFlagManager, FeatureState } from '@platform/flags'

/** Provider 白名单 — 只有在此列表中的 Provider 才允许注册 */
const PROVIDER_WHITELIST: string[] = [
  'mock',
  'openai',
  'anthropic',
  'google',
  'ollama',
  'lmstudio',
  'custom',
]

/** 需要审批的 Provider (敏感操作需要用户确认) */
const HIGH_RISK_PROVIDERS: string[] = [
  'custom',  // 自定义端点未经审计
]

export interface ProviderPolicyCheck {
  allowed: boolean
  reason?: string
  requiresApproval: boolean
}

export class AIProviderPolicy {
  /**
   * 验证 Provider 是否允许注册
   * @returns 策略检查结果
   */
  static validate(name: string): ProviderPolicyCheck {
    // 1. 白名单检查
    if (!PROVIDER_WHITELIST.includes(name)) {
      return {
        allowed: false,
        reason: `Provider "${name}" is not in the allowed whitelist. Allowed: ${PROVIDER_WHITELIST.join(', ')}`,
        requiresApproval: false,
      }
    }

    // 2. Mock Provider 不需要审批
    if (name === 'mock') {
      return { allowed: true, requiresApproval: false }
    }

    // 3. 高风险 Provider 需要用户审批
    const requiresApproval = HIGH_RISK_PROVIDERS.includes(name)

    return { allowed: true, requiresApproval }
  }

  /**
   * 验证调用路径 — 确保通过 ModelGateway
   * @param caller 调用方标识 (e.g. "AIChatPanel", "SearchTool")
   * @returns 是否允许直接调用
   */
  static validateCallPath(caller: string): ProviderPolicyCheck {
    // 仅 AIOrchestrator 和 ModelGateway 内部允许调用 Provider
    const allowedCallers = ['AIOrchestrator', 'ModelGateway', 'TestHarness']

    if (!allowedCallers.includes(caller)) {
      return {
        allowed: false,
        reason: `Component "${caller}" cannot call Provider directly. Route through AIOrchestrator → ModelGateway.`,
        requiresApproval: false,
      }
    }

    return { allowed: true, requiresApproval: false }
  }

  /**
   * 验证 Provider 是否在活跃的 FeatureFlag 下可用
   */
  static isFeatureEnabled(): boolean {
    return featureFlagManager.isEnabled('pb5.ai')
  }

  /** 获取 Provider 白名单 */
  static getWhitelist(): readonly string[] {
    return PROVIDER_WHITELIST
  }

  /** 获取高风险 Provider 列表 */
  static getHighRiskProviders(): readonly string[] {
    return HIGH_RISK_PROVIDERS
  }
}
