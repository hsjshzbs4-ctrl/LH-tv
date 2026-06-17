// src/community/moderation/ModerationService.ts — 内容审核服务
// PB7-S4: 关键词/垃圾检测，自动审核评论和条目

import { featureFlagManager } from '@platform/flags'
import { type Comment, type CommunityItem } from '../contracts'
import { communityRegistry } from '../registry'

/** 审核结果 */
export interface ModerationResult {
  approved: boolean
  flags: string[]
}

export class ModerationService {
  private readonly profanityList = new Set([
    'spam', 'scam', 'phishing',
  ])

  private readonly spamPatterns: RegExp[] = [
    /\b(buy now|click here|free money|earn money|get rich)\b/i,
    /\b(casino|betting|lottery|prize winner)\b/i,
    /(https?:\/\/[^\s]{3,})\1{2,}/i, // 重复 URL
  ]

  /**
   * 审核评论
   */
  moderateComment(comment: Comment): ModerationResult {
    const flags = this.checkContent(comment.content)

    if (flags.length > 0) {
      communityRegistry.updateCommentModerationStatus(
        comment.communityItemId,
        comment.id,
        'flagged',
      )
      return { approved: false, flags }
    }

    communityRegistry.updateCommentModerationStatus(
      comment.communityItemId,
      comment.id,
      'approved',
    )
    return { approved: true, flags: [] }
  }

  /**
   * 审核条目
   */
  moderateItem(item: CommunityItem): ModerationResult {
    const flags: string[] = []

    const titleFlags = this.checkContent(item.title)
    flags.push(...titleFlags)

    const descFlags = this.checkContent(item.description)
    flags.push(...descFlags)

    return { approved: flags.length === 0, flags }
  }

  /**
   * 获取待审核队列
   */
  getModerationQueue(): Comment[] {
    this.ensureEnabled()
    return communityRegistry.getPendingComments()
  }

  /**
   * 批量审核所有待审核评论
   */
  moderateAll(): { total: number; approved: number; flagged: number } {
    this.ensureEnabled()
    const pending = this.getModerationQueue()
    let approved = 0
    let flagged = 0

    for (const comment of pending) {
      const result = this.moderateComment(comment)
      if (result.approved) {
        approved++
      } else {
        flagged++
      }
    }

    return { total: pending.length, approved, flagged }
  }

  /** 检查文本内容 */
  checkContent(text: string): string[] {
    const flags: string[] = []

    if (!text) return flags

    const lower = text.toLowerCase()

    // 检查禁用词
    for (const word of this.profanityList) {
      if (lower.includes(word)) {
        flags.push(`profanity:${word}`)
      }
    }

    // 检查垃圾模式
    for (const pattern of this.spamPatterns) {
      if (pattern.test(text)) {
        flags.push(`spam:${pattern.source.slice(0, 30)}`)
      }
    }

    return flags
  }

  private ensureEnabled(): void {
    if (!featureFlagManager.isEnabled('pb7.community')) {
      throw new Error('Community Platform is not enabled. Enable pb7.community feature flag.')
    }
  }
}

export const moderationService = new ModerationService()
