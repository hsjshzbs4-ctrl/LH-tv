// src/ai/governance/PromptSafetyPolicy.ts — Prompt 安全策略
// PB6 Governance: PII 检测、注入防护、内容过滤、输出安全校验

/** 安全级别 */
export enum SafetyLevel {
  SAFE = 'safe',
  WARNING = 'warning',
  BLOCKED = 'blocked',
}

/** 安全检查结果 */
export interface SafetyCheckResult {
  level: SafetyLevel
  issues: string[]
  sanitized?: string
}

/** PII 检测模式 */
const PII_PATTERNS: Array<{ name: string; pattern: RegExp; description: string }> = [
  {
    name: 'email',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    description: 'Email address detected in prompt',
  },
  {
    name: 'phone_cn',
    pattern: /1[3-9]\d{9}/g,
    description: 'Chinese phone number detected in prompt',
  },
  {
    name: 'id_card',
    pattern: /\d{17}[\dXx]/g,
    description: 'Chinese ID card number detected in prompt',
  },
  {
    name: 'ip_address',
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    description: 'IP address detected in prompt',
  },
]

/** 注入检测模式 */
const INJECTION_PATTERNS: Array<{ name: string; pattern: RegExp; description: string }> = [
  {
    name: 'prompt_override',
    pattern: /(?:ignore|forget|disregard)\s+(?:all\s+)?(?:previous|above|prior)\s+(?:instructions?|prompts?|rules?)/i,
    description: 'Attempt to override system instructions',
  },
  {
    name: 'role_manipulation',
    pattern: /you\s+(?:are|now|act\s+as)\s+(?:a\s+)?(?:hacker|attacker|malware|unrestricted)/i,
    description: 'Attempt to manipulate AI role',
  },
  {
    name: 'code_injection',
    pattern: /<script|javascript:|onerror\s*=|onload\s*=/i,
    description: 'Script/code injection attempt',
  },
]

export class PromptSafetyPolicy {
  /** 对输入 prompt 进行安全检查 */
  static checkInput(prompt: string): SafetyCheckResult {
    const issues: string[] = []

    // 1. 空输入检查
    if (!prompt || prompt.trim().length === 0) {
      return { level: SafetyLevel.BLOCKED, issues: ['Empty prompt'] }
    }

    // 2. 长度限制
    if (prompt.length > 8000) {
      issues.push(`Prompt too long (${prompt.length} chars, max 8000)`)
    }

    // 3. PII 检测
    for (const pii of PII_PATTERNS) {
      if (pii.pattern.test(prompt)) {
        issues.push(pii.description)
      }
    }

    // 4. 注入检测
    for (const injection of INJECTION_PATTERNS) {
      if (injection.pattern.test(prompt)) {
        issues.push(injection.description)
      }
    }

    // 判定级别
    if (issues.length === 0) {
      return { level: SafetyLevel.SAFE, issues: [] }
    }

    const hasCritical = issues.some(
      (i) => i.includes('injection') || i.includes('override') || i.includes('manipulation'),
    )

    if (hasCritical || prompt.length > 8000) {
      return { level: SafetyLevel.BLOCKED, issues }
    }

    return { level: SafetyLevel.WARNING, issues }
  }

  /** 对模型输出进行安全检查 */
  static checkOutput(response: string): SafetyCheckResult {
    const issues: string[] = []

    // 1. 空输出
    if (!response || response.trim().length === 0) {
      return { level: SafetyLevel.WARNING, issues: ['Empty model response'] }
    }

    // 2. PII 泄露检测 (模型不应返回 PII)
    for (const pii of PII_PATTERNS) {
      const matches = response.match(pii.pattern)
      if (matches) {
        issues.push(`Model response contains potential PII: ${pii.description} (${matches.length} occurrences)`)
      }
    }

    return issues.length > 0
      ? { level: SafetyLevel.WARNING, issues }
      : { level: SafetyLevel.SAFE, issues: [] }
  }

  /** 脱敏处理 — 移除 PII */
  static sanitize(text: string): string {
    let sanitized = text
    for (const pii of PII_PATTERNS) {
      sanitized = sanitized.replace(pii.pattern, `[REDACTED_${pii.name.toUpperCase()}]`)
    }
    return sanitized
  }
}
