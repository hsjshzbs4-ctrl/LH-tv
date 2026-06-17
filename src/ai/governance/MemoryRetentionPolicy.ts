// src/ai/governance/MemoryRetentionPolicy.ts — 记忆保留策略
// PB6 Governance: 禁止存储完整 prompt/response，只保留摘要/偏好/快照
// 防止 MemoryStore 无限膨胀

/** 记忆条目类型 */
export enum MemoryEntryType {
  /** 对话摘要 (AI 生成的总结) — 允许 ✅ */
  CONVERSATION_SUMMARY = 'conversation_summary',
  /** 用户偏好 (从对话中提取) — 允许 ✅ */
  USER_PREFERENCE = 'user_preference',
  /** 工具调用结果快照 — 允许 ✅ */
  TOOL_RESULT_SNAPSHOT = 'tool_result_snapshot',
  /** 完整 prompt 记录 — 禁止 ❌ */
  FULL_PROMPT_ARCHIVE = 'full_prompt_archive',
  /** 完整模型响应 — 禁止 ❌ */
  FULL_MODEL_RESPONSE = 'full_model_response',
  /** 原始上下文 — 禁止 ❌ */
  RAW_CONTEXT_DUMP = 'raw_context_dump',
}

/** 记忆条目 */
export interface MemoryEntry {
  id: string
  type: MemoryEntryType
  content: string
  createdAt: number
  expiresAt: number
  metadata?: Record<string, unknown>
}

/** 保留规则 (每个类型) */
export interface RetentionRule {
  type: MemoryEntryType
  allowed: boolean
  ttlMs: number       // 0 = 永久
  maxSizeBytes: number // 0 = 无限制
  description: string
}

/** 内置保留规则 */
const RETENTION_RULES: RetentionRule[] = [
  {
    type: MemoryEntryType.CONVERSATION_SUMMARY,
    allowed: true,
    ttlMs: 90 * 24 * 60 * 60 * 1000, // 90 天
    maxSizeBytes: 50 * 1024,           // 50KB per summary
    description: 'AI-generated conversation summary — allowed, 90-day TTL',
  },
  {
    type: MemoryEntryType.USER_PREFERENCE,
    allowed: true,
    ttlMs: 0,            // 永久
    maxSizeBytes: 0,      // 无限制
    description: 'User preference extracted from conversations — allowed, permanent (user-deletable)',
  },
  {
    type: MemoryEntryType.TOOL_RESULT_SNAPSHOT,
    allowed: true,
    ttlMs: 7 * 24 * 60 * 60 * 1000, // 7 天
    maxSizeBytes: 10 * 1024,          // 10KB per snapshot
    description: 'Tool invocation result snapshot — allowed, 7-day TTL',
  },
  {
    type: MemoryEntryType.FULL_PROMPT_ARCHIVE,
    allowed: false,
    ttlMs: 0,
    maxSizeBytes: 0,
    description: 'Full prompt archive — FORBIDDEN. Use conversation_summary instead.',
  },
  {
    type: MemoryEntryType.FULL_MODEL_RESPONSE,
    allowed: false,
    ttlMs: 0,
    maxSizeBytes: 0,
    description: 'Full model response archive — FORBIDDEN. Use conversation_summary instead.',
  },
  {
    type: MemoryEntryType.RAW_CONTEXT_DUMP,
    allowed: false,
    ttlMs: 0,
    maxSizeBytes: 0,
    description: 'Raw context dump — FORBIDDEN. Context is transient.',
  },
]

/** 全局存储限额 */
export const MEMORY_STORE_LIMITS = {
  /** 最大总存储大小 */
  MAX_TOTAL_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  /** 单类型最大条目数 */
  MAX_ENTRIES_PER_TYPE: 100,
  /** 清理检查间隔 */
  PRUNE_INTERVAL_MS: 60 * 60 * 1000, // 1 hour
} as const

export class MemoryRetentionPolicy {
  private rules = new Map<MemoryEntryType, RetentionRule>()

  constructor() {
    for (const rule of RETENTION_RULES) {
      this.rules.set(rule.type, rule)
    }
  }

  /** 检查条目类型是否允许存储 */
  isAllowed(type: MemoryEntryType): boolean {
    return this.rules.get(type)?.allowed === true
  }

  /** 获取条目的 TTL */
  getTTL(type: MemoryEntryType): number {
    return this.rules.get(type)?.ttlMs ?? 0
  }

  /** 获取条目的最大大小 */
  getMaxSize(type: MemoryEntryType): number {
    return this.rules.get(type)?.maxSizeBytes ?? 0
  }

  /** 检查条目是否过期 */
  isExpired(entry: MemoryEntry): boolean {
    if (entry.expiresAt === 0) return false // 永不过期
    return Date.now() > entry.expiresAt
  }

  /** 获取所有允许的类型 */
  getAllowedTypes(): MemoryEntryType[] {
    return Array.from(this.rules.values())
      .filter((r) => r.allowed)
      .map((r) => r.type)
  }

  /** 获取所有禁止的类型 */
  getForbiddenTypes(): MemoryEntryType[] {
    return Array.from(this.rules.values())
      .filter((r) => !r.allowed)
      .map((r) => r.type)
  }

  /** 获取所有规则 */
  getAllRules(): RetentionRule[] {
    return Array.from(this.rules.values())
  }
}

export const memoryRetentionPolicy = new MemoryRetentionPolicy()
