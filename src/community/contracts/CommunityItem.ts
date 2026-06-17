// src/community/contracts/CommunityItem.ts — 社区内容类型 (唯一 SSOT)
// PB7-S4: Community Platform 所有模块必须读取此定义
// 禁止: TemplateModel / AgentModel / PluginRating 等衍生类型

import type { CertificationLevel } from '@ecosystem/index'

// ── 社区内容类型 ──

/** 社区内容条目类型 */
export type CommunityItemType = 'template' | 'agent' | 'plugin' | 'theme' | 'capability_pack'

/** 社区内容条目 — PB7-S4 唯一 SSOT */
export interface CommunityItem {
  /** 全局唯一标识 */
  id: string
  /** 条目类型 */
  type: CommunityItemType
  /** 标题 */
  title: string
  /** 描述 */
  description: string
  /** 作者 ID */
  authorId: string
  /** 作者名称 */
  authorName: string
  /** 关联的 Marketplace 扩展 ID (可选) */
  manifestRef?: string
  /** 标签 */
  tags: string[]
  /** 平均评分 (非规范化, 每次评分后重算) */
  averageRating: number
  /** 评分数量 */
  ratingCount: number
  /** 评论数量 */
  commentCount: number
  /** 下载/安装次数 */
  downloads: number
  /** 认证级别 — 复用 Ecosystem Governance SSOT */
  certificationLevel: CertificationLevel
  /** 创建时间 (ms) */
  createdAt: number
  /** 更新时间 (ms) */
  updatedAt: number
}

// ── 评分 ──

/** 用户评分 */
export interface Rating {
  /** 评分 ID */
  id: string
  /** 社区条目 ID */
  communityItemId: string
  /** 用户 ID */
  userId: string
  /** 评分 (1~5) */
  score: number
  /** 创建时间 (ms) */
  createdAt: number
}

// ── 评论 ──

/** 评论审核状态 */
export type ModerationStatus = 'approved' | 'pending' | 'flagged' | 'removed'

/** 用户评论 */
export interface Comment {
  /** 评论 ID */
  id: string
  /** 社区条目 ID */
  communityItemId: string
  /** 用户 ID */
  userId: string
  /** 评论内容 */
  content: string
  /** 审核状态 */
  moderationStatus: ModerationStatus
  /** 创建时间 (ms) */
  createdAt: number
  /** 更新时间 (ms) */
  updatedAt?: number
  /** 审核时间 (ms) */
  moderatedAt?: number
}

// ── 分享 ──

/** 分享目标平台 */
export type SharePlatform = 'clipboard' | 'url' | 'social'

/** 分享目标 */
export interface ShareTarget {
  /** 条目 ID */
  itemId: string
  /** 目标平台 */
  platform: SharePlatform
  /** 额外元数据 */
  metadata?: Record<string, string>
}

// ── Feed ──

/** Feed 查询选项 */
export interface FeedQuery {
  /** 按类型过滤 */
  type?: CommunityItemType
  /** 按标签过滤 */
  tag?: string
  /** 按认证级别过滤 */
  certificationLevel?: CertificationLevel
  /** 搜索关键词 */
  keyword?: string
  /** 排序字段 */
  sort?: 'rating' | 'downloads' | 'updated' | 'name'
  /** 排序方向 */
  order?: 'asc' | 'desc'
  /** 分页偏移 */
  offset?: number
  /** 分页大小 */
  limit?: number
}

/** Feed 条目 — 带相关性和推荐理由 */
export interface FeedEntry {
  /** 社区条目 */
  item: CommunityItem
  /** 相关性评分 (0~1) */
  relevanceScore: number
  /** 推荐理由 */
  recommendationReason: string
}

// ── 举报 ──

/** 举报状态 */
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'

/** 用户举报 */
export interface Report {
  /** 举报 ID */
  id: string
  /** 被举报的条目 ID */
  communityItemId: string
  /** 举报者 ID */
  reporterId: string
  /** 举报原因 */
  reason: string
  /** 举报状态 */
  status: ReportStatus
  /** 创建时间 (ms) */
  createdAt: number
  /** 处理时间 (ms) */
  resolvedAt?: number
}

// ── 模板配置 ──

/** 模板配置 — 模板类型 CommunityItem 的额外元数据 */
export interface TemplateConfig {
  /** 模板插槽定义 */
  slots: string[]
  /** 模板变量 */
  variables: Record<string, string>
  /** 预览图 URL */
  previewImage?: string
}

// ── 校验 ──

/** 社区条目校验结果 */
export interface CommunityItemValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * 社区条目校验器 — 验证 CommunityItem 的完整性和合法性
 * 所有注册入口必须调用此校验
 */
export function validateCommunityItem(item: unknown): CommunityItemValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!item || typeof item !== 'object') {
    return { valid: false, errors: ['CommunityItem must be a non-null object'], warnings: [] }
  }

  const m = item as Record<string, unknown>

  // 必填字段校验
  if (!m.title || typeof m.title !== 'string') errors.push('title is required (string)')
  if (m.title && typeof m.title === 'string') {
    if (m.title.trim().length === 0) errors.push('title must not be empty')
    if (m.title.length > 200) errors.push('title must not exceed 200 characters')
  }
  if (!m.description || typeof m.description !== 'string') {
    warnings.push('description is recommended')
  }
  if (!m.authorId || typeof m.authorId !== 'string') errors.push('authorId is required (string)')
  if (!m.authorName || typeof m.authorName !== 'string') errors.push('authorName is required (string)')
  if (!m.type || typeof m.type !== 'string') {
    errors.push('type is required')
  } else if (!['template', 'agent', 'plugin', 'theme', 'capability_pack'].includes(m.type as string)) {
    errors.push('type must be one of: template, agent, plugin, theme, capability_pack')
  }

  // 可选字段类型校验
  if (m.tags !== undefined && !Array.isArray(m.tags)) {
    errors.push('tags must be an array of strings')
  }

  if (m.certificationLevel !== undefined && typeof m.certificationLevel !== 'string') {
    errors.push('certificationLevel must be a string')
  }

  return { valid: errors.length === 0, errors, warnings }
}
