// tests/unit/community/community-registry.spec.ts — CommunityRegistry 单元测试
// PB7-S4: 验证 SSOT Registry 的注册/搜索/评分/评论/举报

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CommunityRegistry } from '@community/index'
import { CertificationLevel } from '@ecosystem/index'

// Mock feature flag manager — enabled
vi.mock('@platform/flags', () => ({
  featureFlagManager: {
    isEnabled: vi.fn().mockReturnValue(true),
  },
}))

// Mock marketplace registry — has some entries
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

describe('CommunityRegistry', () => {
  let registry: CommunityRegistry

  const validItem = {
    title: 'Test Template',
    description: 'A test template for unit testing',
    authorId: 'test-author',
    authorName: 'Test Author',
    type: 'template' as const,
    tags: ['test', 'template'],
    certificationLevel: CertificationLevel.COMMUNITY,
  }

  beforeEach(() => {
    registry = new CommunityRegistry()
  })

  // ── register ──

  describe('register', () => {
    it('registers a valid community item', () => {
      const result = registry.register(validItem)
      expect(result.success).toBe(true)
      expect(result.item).toBeDefined()
      expect(result.item?.id).toBe('test-author.test-template')
      expect(result.item?.type).toBe('template')
      expect(result.item?.averageRating).toBe(0)
      expect(result.item?.ratingCount).toBe(0)
      expect(result.item?.commentCount).toBe(0)
      expect(result.item?.downloads).toBe(0)
    })

    it('generates unique ID from authorId and title', () => {
      const result = registry.register(validItem)
      expect(result.item?.id).toMatch(/^test-author\./)
    })

    it('rejects duplicate registration', () => {
      registry.register(validItem)
      const result = registry.register(validItem)
      expect(result.success).toBe(false)
      expect(result.error).toContain('already registered')
    })

    it('rejects invalid item (missing title)', () => {
      const result = registry.register({ ...validItem, title: '' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('Validation failed')
    })

    it('rejects UNCERTIFIED user publishing', () => {
      const result = registry.register({
        ...validItem,
        certificationLevel: CertificationLevel.UNCERTIFIED,
      })
      expect(result.success).toBe(false)
      expect(result.error).toContain('FORBIDDEN')
    })

    it('allows OFFICIAL user publishing', () => {
      const result = registry.register({
        ...validItem,
        certificationLevel: CertificationLevel.OFFICIAL,
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid type', () => {
      const result = registry.register({ ...validItem, type: 'invalid' as any })
      expect(result.success).toBe(false)
      expect(result.error).toContain('Validation failed')
    })
  })

  // ── search ──

  describe('search', () => {
    beforeEach(() => {
      registry.register({ ...validItem, title: 'Alpha', tags: ['ui'] })
      registry.register({ ...validItem, title: 'Beta Template', tags: ['api'], type: 'template' })
      registry.register({ ...validItem, title: 'Gamma Agent', tags: ['ui', 'ai'], type: 'agent' })
    })

    it('returns all items with no filters', () => {
      const results = registry.search()
      expect(results.length).toBe(3)
    })

    it('filters by type', () => {
      const results = registry.search({ type: 'agent' })
      expect(results.length).toBe(1)
      expect(results[0].type).toBe('agent')
    })

    it('filters by tag', () => {
      const results = registry.search({ tag: 'ui' })
      expect(results.length).toBe(2)
    })

    it('filters by keyword', () => {
      const results = registry.search({ keyword: 'Gamma' })
      expect(results.length).toBe(1)
      expect(results[0].title).toBe('Gamma Agent')
    })

    it('sorts by name asc', () => {
      const results = registry.search({ sort: 'name', order: 'asc' })
      expect(results[0].title).toBe('Alpha')
      expect(results[2].title).toBe('Gamma Agent')
    })

    it('paginates', () => {
      const page1 = registry.search({ limit: 2, offset: 0 })
      const page2 = registry.search({ limit: 2, offset: 2 })
      expect(page1.length).toBe(2)
      expect(page2.length).toBe(1)
    })
  })

  // ── ratings ──

  describe('ratings', () => {
    beforeEach(() => {
      registry.register(validItem)
    })

    it('adds a rating and recalculates average', () => {
      const itemId = 'test-author.test-template'
      const r1 = registry.addRating(itemId, { communityItemId: itemId, userId: 'user1', score: 4 })
      expect(r1.success).toBe(true)
      expect(r1.rating?.score).toBe(4)

      const item = registry.get(itemId)
      expect(item?.averageRating).toBe(4)
      expect(item?.ratingCount).toBe(1)
    })

    it('recalculates average with multiple ratings', () => {
      const itemId = 'test-author.test-template'
      registry.addRating(itemId, { communityItemId: itemId, userId: 'user1', score: 5 })
      registry.addRating(itemId, { communityItemId: itemId, userId: 'user2', score: 3 })

      const item = registry.get(itemId)
      expect(item?.averageRating).toBe(4)
      expect(item?.ratingCount).toBe(2)
    })

    it('user re-rating overwrites previous', () => {
      const itemId = 'test-author.test-template'
      registry.addRating(itemId, { communityItemId: itemId, userId: 'user1', score: 2 })
      registry.addRating(itemId, { communityItemId: itemId, userId: 'user1', score: 5 })

      const item = registry.get(itemId)
      expect(item?.averageRating).toBe(5)
      expect(item?.ratingCount).toBe(1)
    })

    it('rejects score out of range', () => {
      const itemId = 'test-author.test-template'
      const r1 = registry.addRating(itemId, { communityItemId: itemId, userId: 'user1', score: 0 })
      const r2 = registry.addRating(itemId, { communityItemId: itemId, userId: 'user2', score: 6 })
      expect(r1.success).toBe(false)
      expect(r2.success).toBe(false)
    })

    it('rejects rating for non-existent item', () => {
      const r = registry.addRating('nonexistent', { communityItemId: 'nonexistent', userId: 'user1', score: 3 })
      expect(r.success).toBe(false)
    })
  })

  // ── comments ──

  describe('comments', () => {
    beforeEach(() => {
      registry.register(validItem)
    })

    it('adds a comment with pending status', () => {
      const itemId = 'test-author.test-template'
      const result = registry.addComment(itemId, {
        communityItemId: itemId,
        userId: 'user1',
        content: 'Great template!',
      })
      expect(result.success).toBe(true)
      expect(result.comment?.moderationStatus).toBe('pending')
    })

    it('rejects empty comment', () => {
      const itemId = 'test-author.test-template'
      const result = registry.addComment(itemId, {
        communityItemId: itemId,
        userId: 'user1',
        content: '',
      })
      expect(result.success).toBe(false)
    })

    it('increments comment count', () => {
      const itemId = 'test-author.test-template'
      registry.addComment(itemId, { communityItemId: itemId, userId: 'user1', content: 'Nice!' })
      const item = registry.get(itemId)
      expect(item?.commentCount).toBe(1)
    })

    it('only returns approved comments by default', () => {
      const itemId = 'test-author.test-template'
      const c1 = registry.addComment(itemId, { communityItemId: itemId, userId: 'user1', content: 'A' })
      registry.addComment(itemId, { communityItemId: itemId, userId: 'user2', content: 'B' })

      // Use actual comment ID from the returned comment
      registry.updateCommentModerationStatus(itemId, c1.comment!.id, 'approved')

      const comments = registry.getComments(itemId)
      expect(comments.length).toBe(1)
      expect(comments[0].moderationStatus).toBe('approved')
    })

    it('returns all comments with includeModerated=true', () => {
      const itemId = 'test-author.test-template'
      registry.addComment(itemId, { communityItemId: itemId, userId: 'user1', content: 'A' })
      registry.addComment(itemId, { communityItemId: itemId, userId: 'user2', content: 'B' })

      const comments = registry.getComments(itemId, true)
      expect(comments.length).toBe(2)
    })

    it('removes comment and decrements count', () => {
      const itemId = 'test-author.test-template'
      const c1 = registry.addComment(itemId, { communityItemId: itemId, userId: 'user1', content: 'A' })
      expect(registry.getComments(itemId, true).length).toBe(1)

      registry.removeComment(itemId, c1.comment!.id)
      expect(registry.getComments(itemId, true).length).toBe(0)
      expect(registry.get(itemId)?.commentCount).toBe(0)
    })
  })

  // ── reports ──

  describe('reports', () => {
    beforeEach(() => {
      registry.register(validItem)
    })

    it('files a report', () => {
      const result = registry.fileReport({
        communityItemId: 'test-author.test-template',
        reporterId: 'user1',
        reason: 'Inappropriate content',
      })
      expect(result.success).toBe(true)
      expect(result.report?.status).toBe('pending')
    })

    it('rejects report for non-existent item', () => {
      const result = registry.fileReport({
        communityItemId: 'nonexistent',
        reporterId: 'user1',
        reason: 'Spam',
      })
      expect(result.success).toBe(false)
    })

    it('filters reports by status', () => {
      registry.fileReport({ communityItemId: 'test-author.test-template', reporterId: 'u1', reason: 'R1' })
      registry.fileReport({ communityItemId: 'test-author.test-template', reporterId: 'u2', reason: 'R2' })

      const pending = registry.getReports({ status: 'pending' })
      expect(pending.length).toBe(2)

      const reportId = pending[0].id
      registry.resolveReport(reportId, 'resolved')

      const resolved = registry.getReports({ status: 'resolved' })
      expect(resolved.length).toBe(1)
    })
  })

  // ── stats ──

  describe('stats', () => {
    it('returns correct stats', () => {
      registry.register({ ...validItem, type: 'template' })
      registry.register({ ...validItem, title: 'Other', type: 'agent' })

      const stats = registry.stats()
      expect(stats.total).toBe(2)
      expect(stats.byType?.template).toBe(1)
      expect(stats.byType?.agent).toBe(1)
    })
  })

  // ── recordDownload ──

  describe('recordDownload', () => {
    it('increments download count', () => {
      registry.register(validItem)
      const itemId = 'test-author.test-template'

      registry.recordDownload(itemId)
      registry.recordDownload(itemId)

      const item = registry.get(itemId)
      expect(item?.downloads).toBe(2)
    })
  })
})
