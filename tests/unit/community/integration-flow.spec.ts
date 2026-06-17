// tests/unit/community/integration-flow.spec.ts — Community 集成流测试
// PB7-S4: 端到端 注册 → 评分 → 评论 → 审核 → Feed → 举报

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  CommunityRegistry,
  FeedService,
  ModerationService,
  CommunityRecommendation,
  CommunityPolicy,
  validateCommunityItem,
} from '@community/index'
import { CertificationLevel } from '@ecosystem/index'

// Mock feature flag manager
vi.mock('@platform/flags', () => ({
  featureFlagManager: {
    isEnabled: vi.fn().mockReturnValue(true),
  },
}))

// Mock marketplace registry
vi.mock('@ecosystem/index', async () => {
  const actual = await vi.importActual('@ecosystem/index')
  return {
    ...actual,
    marketplaceRegistry: {
      has: vi.fn().mockReturnValue(true),
      get: vi.fn().mockReturnValue({ manifest: { id: 'test.plugin', name: 'Test' } }),
    },
  }
})

describe('Community Integration Flow', () => {
  let registry: CommunityRegistry
  let feedService: FeedService
  let moderationService: ModerationService

  beforeEach(() => {
    registry = new CommunityRegistry()
    feedService = new FeedService()
    moderationService = new ModerationService()
  })

  it('validates a community item correctly', () => {
    const valid = validateCommunityItem({
      title: 'My Template',
      authorId: 'dev1',
      authorName: 'Dev One',
      type: 'template',
    })
    expect(valid.valid).toBe(true)

    const invalid = validateCommunityItem({})
    expect(invalid.valid).toBe(false)
    expect(invalid.errors.length).toBeGreaterThan(0)
  })

  it('full lifecycle: register → rate → comment → moderate → verify shareable', () => {
    // 1. Register
    const regResult = registry.register({
      title: 'Awesome Template',
      description: 'An awesome community template',
      authorId: 'dev42',
      authorName: 'Developer 42',
      type: 'template',
      tags: ['ui', 'layout'],
      certificationLevel: CertificationLevel.COMMUNITY,
    })
    expect(regResult.success).toBe(true)
    const itemId = regResult.item!.id

    // 2. Rate
    const r1 = registry.addRating(itemId, {
      communityItemId: itemId,
      userId: 'user_a',
      score: 5,
    })
    expect(r1.success).toBe(true)

    const r2 = registry.addRating(itemId, {
      communityItemId: itemId,
      userId: 'user_b',
      score: 4,
    })
    expect(r2.success).toBe(true)

    const item = registry.get(itemId)
    expect(item?.averageRating).toBe(4.5)
    expect(item?.ratingCount).toBe(2)

    // 3. Comment
    const cResult = registry.addComment(itemId, {
      communityItemId: itemId,
      userId: 'user_a',
      content: 'This template is amazing!',
    })
    expect(cResult.success).toBe(true)
    expect(cResult.comment?.moderationStatus).toBe('pending')
    const commentId = cResult.comment!.id

    // 4. Moderate — use the actual comment ID
    registry.updateCommentModerationStatus(itemId, commentId, 'approved')

    const comments = registry.getComments(itemId)
    expect(comments.length).toBe(1)
    expect(comments[0].moderationStatus).toBe('approved')

    // 5. Verify item is shareable (SAFE for COMMUNITY+)
    expect(CommunityPolicy.canShare(item!.certificationLevel)).toBe(true)

    // 6. Verify item appears in registry stats
    const stats = registry.stats()
    expect(stats.total).toBeGreaterThanOrEqual(1)
    expect(stats.totalRatings).toBe(2)
    expect(stats.totalComments).toBe(1)
  })

  it('moderation detects spam in comment flow', () => {
    const regResult = registry.register({
      title: 'Test Item',
      authorId: 'dev1',
      authorName: 'Dev',
      type: 'template',
      certificationLevel: CertificationLevel.COMMUNITY,
    })
    const itemId = regResult.item!.id

    const cResult = registry.addComment(itemId, {
      communityItemId: itemId,
      userId: 'spammer',
      content: 'Get rich quick! Click here to buy now!',
    })
    expect(cResult.success).toBe(true)

    const modResult = moderationService.moderateComment(cResult.comment!)
    expect(modResult.approved).toBe(false)
    expect(modResult.flags.length).toBeGreaterThan(0)
  })

  it('report flow: file → get → resolve (via registry directly)', () => {
    const regResult = registry.register({
      title: 'Reportable Item',
      authorId: 'dev1',
      authorName: 'Dev',
      type: 'template',
      certificationLevel: CertificationLevel.COMMUNITY,
    })
    const itemId = regResult.item!.id

    // File report directly via registry
    const reportResult = registry.fileReport({
      communityItemId: itemId,
      reporterId: 'user1',
      reason: 'Inappropriate content',
    })
    expect(reportResult.success).toBe(true)
    expect(reportResult.report?.status).toBe('pending')
    const reportId = reportResult.report!.id

    // Get pending reports
    const pending = registry.getReports({ status: 'pending' })
    expect(pending.length).toBe(1)

    // Resolve
    const resolved = registry.resolveReport(reportId, 'resolved')
    expect(resolved).toBe(true)

    const after = registry.getReports({ status: 'resolved' })
    expect(after.length).toBe(1)
  })

  it('search finds items by tag and type', () => {
    registry.register({
      title: 'UI Template',
      authorId: 'dev1',
      authorName: 'Dev1',
      type: 'template',
      tags: ['ui', 'dark-mode'],
      certificationLevel: CertificationLevel.COMMUNITY,
    })

    registry.register({
      title: 'AI Agent',
      authorId: 'dev2',
      authorName: 'Dev2',
      type: 'agent',
      tags: ['ai', 'chatbot'],
      certificationLevel: CertificationLevel.COMMUNITY,
    })

    // Search by type
    const templates = registry.search({ type: 'template' })
    expect(templates.length).toBe(1)
    expect(templates[0].title).toBe('UI Template')

    // Search by tag
    const aiItems = registry.search({ tag: 'ai' })
    expect(aiItems.length).toBe(1)
    expect(aiItems[0].type).toBe('agent')
  })

  it('UNCERTIFIED user cannot publish but can rate and comment (via static policy)', () => {
    // Publish blocked
    const pubResult = registry.register({
      title: 'Blocked Template',
      authorId: 'newbie',
      authorName: 'New User',
      type: 'template',
      certificationLevel: CertificationLevel.UNCERTIFIED,
    })
    expect(pubResult.success).toBe(false)
    expect(pubResult.error).toContain('FORBIDDEN')

    // SAFE actions allowed via CommunityPolicy (static — no registry needed)
    expect(CommunityPolicy.canRate(CertificationLevel.UNCERTIFIED)).toBe(true)
    expect(CommunityPolicy.canComment(CertificationLevel.UNCERTIFIED)).toBe(true)
    expect(CommunityPolicy.canShare(CertificationLevel.UNCERTIFIED)).toBe(true)
  })

  it('CommunityRecommendation computes similarity correctly', () => {
    const a = {
      id: 'a',
      type: 'template' as const,
      title: 'A',
      description: '',
      authorId: '',
      authorName: '',
      tags: ['ui', 'dark', 'responsive'],
      averageRating: 4,
      ratingCount: 1,
      commentCount: 0,
      downloads: 10,
      certificationLevel: CertificationLevel.COMMUNITY,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const b = {
      ...a,
      id: 'b',
      title: 'B',
      tags: ['ui', 'dark', 'mobile'],
    }

    const similarity = CommunityRecommendation.computeSimilarity(a, b)
    expect(similarity).toBeGreaterThan(0)
    expect(similarity).toBeLessThanOrEqual(1)

    // Same type bonus
    const c = { ...a, id: 'c', type: 'agent' as const, tags: ['completely', 'different'] }
    const similarityDiff = CommunityRecommendation.computeSimilarity(a, c)
    expect(similarityDiff).toBeLessThan(similarity)
  })
})
