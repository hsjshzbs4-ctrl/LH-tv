// src/community/registry/CommunityRegistry.ts — 唯一 Community SSOT
// PB7-S4: 单一 Registry 入口，禁止多 Registry / 多 Source Of Truth
// 遵循 MarketplaceRegistry 模式，只读访问 MarketplaceRegistry

import { featureFlagManager } from '@platform/flags'
import {
  marketplaceRegistry,
  type MarketplaceEntry,
  type ExtensionManifest,
  CertificationLevel,
} from '@ecosystem/index'
import {
  validateCommunityItem,
  type CommunityItem,
  type CommunityItemType,
  type Rating,
  type Comment,
  type FeedQuery,
  type ModerationStatus,
} from '../contracts'
import type { Report, ReportStatus } from '../contracts'
import { CommunityAction, CommunityPolicy } from '../governance'

/** Community Registry 统计 */
export interface CommunityStats {
  total: number
  byType: Record<string, number>
  totalRatings: number
  totalComments: number
  totalDownloads: number
}

export class CommunityRegistry {
  private items = new Map<string, CommunityItem>()
  private ratings = new Map<string, Map<string, Rating>>() // itemId → userId → Rating
  private comments = new Map<string, Comment[]>() // itemId → Comment[]
  private reports: Report[] = []

  /**
   * 注册社区条目
   * Manifest 必须通过校验，这是唯一入口点
   */
  register(
    item: Omit<CommunityItem, 'id' | 'createdAt' | 'updatedAt' | 'averageRating' | 'ratingCount' | 'commentCount' | 'downloads'>,
  ): { success: boolean; item?: CommunityItem; error?: string } {
    this.ensureEnabled()

    // 1. 校验
    const validation = validateCommunityItem(item)
    if (!validation.valid) {
      return { success: false, error: `Validation failed: ${validation.errors.join('; ')}` }
    }

    // 2. 生成 ID
    const id = this.generateId(item.authorId, item.title)

    // 3. 唯一性检查
    if (this.items.has(id)) {
      return { success: false, error: `Community item "${id}" already registered` }
    }

    // 4. 权限检查 — 发布需要 COMMUNITY+
    const certLevel = item.certificationLevel ?? CertificationLevel.UNCERTIFIED
    const publishCheck = CommunityPolicy.validate(certLevel, CommunityAction.PUBLISH_TEMPLATE)
    if (!publishCheck.allowed) {
      return { success: false, error: publishCheck.reason }
    }

    // 5. 如果关联 Marketplace，验证扩展存在
    if (item.manifestRef && !marketplaceRegistry.has(item.manifestRef)) {
      return { success: false, error: `Referenced extension "${item.manifestRef}" not found in Marketplace` }
    }

    const now = Date.now()
    const communityItem: CommunityItem = {
      ...item,
      id,
      averageRating: 0,
      ratingCount: 0,
      commentCount: 0,
      downloads: 0,
      certificationLevel: certLevel,
      createdAt: now,
      updatedAt: now,
    }

    this.items.set(id, communityItem)
    return { success: true, item: communityItem }
  }

  /** 获取单个条目 */
  get(id: string): CommunityItem | null {
    return this.items.get(id) ?? null
  }

  /** 检查条目是否存在 */
  has(id: string): boolean {
    return this.items.has(id)
  }

  /** 搜索社区条目 */
  search(query: FeedQuery = {}): CommunityItem[] {
    let results = Array.from(this.items.values())

    // 过滤
    if (query.type) {
      results = results.filter((i) => i.type === query.type)
    }

    if (query.tag) {
      results = results.filter((i) => i.tags.includes(query.tag!))
    }

    if (query.certificationLevel) {
      results = results.filter((i) => i.certificationLevel === query.certificationLevel)
    }

    if (query.keyword) {
      const kw = query.keyword.toLowerCase()
      results = results.filter(
        (i) =>
          i.title.toLowerCase().includes(kw) ||
          i.description.toLowerCase().includes(kw) ||
          i.authorName.toLowerCase().includes(kw) ||
          i.tags.some((t) => t.toLowerCase().includes(kw)),
      )
    }

    // 排序
    const order = query.order ?? 'desc'
    const multiplier = order === 'asc' ? 1 : -1

    switch (query.sort) {
      case 'rating':
        results.sort((a, b) => (a.averageRating - b.averageRating) * multiplier)
        break
      case 'downloads':
        results.sort((a, b) => (a.downloads - b.downloads) * multiplier)
        break
      case 'updated':
        results.sort((a, b) => (a.updatedAt - b.updatedAt) * multiplier)
        break
      case 'name':
      default:
        results.sort((a, b) => a.title.localeCompare(b.title) * multiplier)
    }

    // 分页
    const offset = query.offset ?? 0
    const limit = query.limit ?? 50
    return results.slice(offset, offset + limit)
  }

  // ── 评分 ──

  /** 添加评分 */
  addRating(
    communityItemId: string,
    rating: Omit<Rating, 'id' | 'createdAt'>,
  ): { success: boolean; rating?: Rating; error?: string } {
    this.ensureEnabled()

    const item = this.items.get(communityItemId)
    if (!item) {
      return { success: false, error: `Community item "${communityItemId}" not found` }
    }

    // 权限检查
    if (!CommunityPolicy.canRate(item.certificationLevel)) {
      return { success: false, error: 'Rating not allowed for this certification level' }
    }

    // 评分范围校验
    if (rating.score < 1 || rating.score > 5) {
      return { success: false, error: 'Score must be between 1 and 5' }
    }

    let itemRatings = this.ratings.get(communityItemId)
    if (!itemRatings) {
      itemRatings = new Map()
      this.ratings.set(communityItemId, itemRatings)
    }

    const id = `rating_${communityItemId}_${rating.userId}_${Date.now().toString(36)}`
    const newRating: Rating = {
      ...rating,
      id,
      createdAt: Date.now(),
    }

    // 用户重复评分 — 覆盖旧评分
    itemRatings.set(rating.userId, newRating)

    // 重算平均评分
    this.recalculateAverageRating(communityItemId)
    item.updatedAt = Date.now()

    return { success: true, rating: newRating }
  }

  /** 获取条目的评分列表 */
  getRatings(communityItemId: string): Rating[] {
    const itemRatings = this.ratings.get(communityItemId)
    return itemRatings ? Array.from(itemRatings.values()) : []
  }

  // ── 评论 ──

  /** 添加评论 (初始状态: pending) */
  addComment(
    communityItemId: string,
    comment: Omit<Comment, 'id' | 'createdAt' | 'moderationStatus'>,
  ): { success: boolean; comment?: Comment; error?: string } {
    this.ensureEnabled()

    const item = this.items.get(communityItemId)
    if (!item) {
      return { success: false, error: `Community item "${communityItemId}" not found` }
    }

    if (!CommunityPolicy.canComment(item.certificationLevel)) {
      return { success: false, error: 'Comment not allowed for this certification level' }
    }

    if (!comment.content || comment.content.trim().length === 0) {
      return { success: false, error: 'Comment content must not be empty' }
    }

    if (comment.content.length > 2000) {
      return { success: false, error: 'Comment content must not exceed 2000 characters' }
    }

    const newComment: Comment = {
      ...comment,
      id: `comment_${communityItemId}_${Date.now().toString(36)}`,
      moderationStatus: 'pending',
      createdAt: Date.now(),
    }

    let itemComments = this.comments.get(communityItemId)
    if (!itemComments) {
      itemComments = []
      this.comments.set(communityItemId, itemComments)
    }
    itemComments.push(newComment)

    item.commentCount = itemComments.length
    item.updatedAt = Date.now()

    return { success: true, comment: newComment }
  }

  /** 获取评论列表 (仅返回已批准的) */
  getComments(communityItemId: string, includeModerated = false): Comment[] {
    const itemComments = this.comments.get(communityItemId) ?? []
    if (includeModerated) return [...itemComments]
    return itemComments.filter((c) => c.moderationStatus === 'approved')
  }

  /** 更新评论审核状态 */
  updateCommentModerationStatus(
    communityItemId: string,
    commentId: string,
    status: ModerationStatus,
  ): boolean {
    const itemComments = this.comments.get(communityItemId)
    if (!itemComments) return false

    const comment = itemComments.find((c) => c.id === commentId)
    if (!comment) return false

    comment.moderationStatus = status
    comment.moderatedAt = Date.now()
    return true
  }

  /** 删除评论 */
  removeComment(communityItemId: string, commentId: string): boolean {
    const itemComments = this.comments.get(communityItemId)
    if (!itemComments) return false

    const index = itemComments.findIndex((c) => c.id === commentId)
    if (index === -1) return false

    itemComments.splice(index, 1)

    const item = this.items.get(communityItemId)
    if (item) {
      item.commentCount = itemComments.length
      item.updatedAt = Date.now()
    }

    return true
  }

  /** 获取待审核评论 */
  getPendingComments(): Comment[] {
    const pending: Comment[] = []
    for (const itemComments of this.comments.values()) {
      for (const comment of itemComments) {
        if (comment.moderationStatus === 'pending' || comment.moderationStatus === 'flagged') {
          pending.push(comment)
        }
      }
    }
    return pending
  }

  // ── 举报 ──

  /** 提交举报 */
  fileReport(
    report: Omit<Report, 'id' | 'createdAt' | 'status'>,
  ): { success: boolean; report?: Report; error?: string } {
    this.ensureEnabled()

    if (!this.items.has(report.communityItemId)) {
      return { success: false, error: `Community item "${report.communityItemId}" not found` }
    }

    const newReport: Report = {
      ...report,
      id: `report_${Date.now().toString(36)}`,
      status: 'pending',
      createdAt: Date.now(),
    }

    this.reports.push(newReport)
    return { success: true, report: newReport }
  }

  /** 查询举报 */
  getReports(filter?: { status?: ReportStatus; itemId?: string }): Report[] {
    let results = [...this.reports]
    if (filter?.status) {
      results = results.filter((r) => r.status === filter.status)
    }
    if (filter?.itemId) {
      results = results.filter((r) => r.communityItemId === filter.itemId)
    }
    return results
  }

  /** 处理举报 */
  resolveReport(reportId: string, resolution: 'resolved' | 'dismissed'): boolean {
    const report = this.reports.find((r) => r.id === reportId)
    if (!report) return false
    report.status = resolution
    report.resolvedAt = Date.now()
    return true
  }

  // ── 管理 ──

  /** 更新下载统计 */
  recordDownload(id: string): void {
    const item = this.items.get(id)
    if (item) {
      item.downloads++
      item.updatedAt = Date.now()
    }
  }

  /** 删除条目 (需要 OFFICIAL 认证级别检查 — 由调用方负责) */
  remove(id: string): boolean {
    this.ensureEnabled()
    this.ratings.delete(id)
    this.comments.delete(id)
    this.reports = this.reports.filter((r) => r.communityItemId !== id)
    return this.items.delete(id)
  }

  /** 列出所有条目 */
  listAll(): CommunityItem[] {
    return Array.from(this.items.values())
  }

  /** 统计 */
  stats(): CommunityStats {
    const entries = this.listAll()
    const byType: Record<string, number> = {}
    let totalRatings = 0
    let totalComments = 0
    let totalDownloads = 0

    for (const entry of entries) {
      byType[entry.type] = (byType[entry.type] ?? 0) + 1
      totalRatings += entry.ratingCount
      totalComments += entry.commentCount
      totalDownloads += entry.downloads
    }

    return {
      total: entries.length,
      byType,
      totalRatings,
      totalComments,
      totalDownloads,
    }
  }

  // ── 内部 ──

  private generateId(authorId: string, title: string): string {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 50)
    return `${authorId}.${slug}`
  }

  private recalculateAverageRating(communityItemId: string): void {
    const item = this.items.get(communityItemId)
    if (!item) return

    const itemRatings = this.ratings.get(communityItemId)
    if (!itemRatings || itemRatings.size === 0) {
      item.averageRating = 0
      item.ratingCount = 0
      return
    }

    const values = Array.from(itemRatings.values())
    const sum = values.reduce((acc, r) => acc + r.score, 0)
    item.averageRating = Math.round((sum / values.length) * 10) / 10
    item.ratingCount = values.length
  }

  private ensureEnabled(): void {
    if (!featureFlagManager.isEnabled('pb7.community')) {
      throw new Error('Community Platform is not enabled. Enable pb7.community feature flag.')
    }
  }
}

/** 全局唯一 Community Registry 实例 */
export const communityRegistry = new CommunityRegistry()
