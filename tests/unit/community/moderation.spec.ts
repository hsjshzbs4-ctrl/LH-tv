// tests/unit/community/moderation.spec.ts — 审核服务单元测试
// PB7-S4: ModerationService.checkContent (纯函数) + ReportService 通过 registry

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ModerationService } from '@community/index'

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

describe('ModerationService', () => {
  let service: ModerationService

  beforeEach(() => {
    service = new ModerationService()
  })

  describe('checkContent (pure function — no registry dependency)', () => {
    it('returns empty flags for clean content', () => {
      const flags = service.checkContent('This is a normal comment about templates')
      expect(flags.length).toBe(0)
    })

    it('detects profanity', () => {
      const flags = service.checkContent('This is a spam message')
      expect(flags.length).toBeGreaterThan(0)
      expect(flags.some((f) => f.includes('profanity'))).toBe(true)
    })

    it('detects spam patterns', () => {
      const flags = service.checkContent('Click here to buy now! Get rich quick!')
      expect(flags.length).toBeGreaterThan(0)
      expect(flags.some((f) => f.includes('spam'))).toBe(true)
    })

    it('handles empty text', () => {
      const flags = service.checkContent('')
      expect(flags.length).toBe(0)
    })

    it('handles null/undefined gracefully', () => {
      const flags = service.checkContent(undefined as unknown as string)
      expect(flags.length).toBe(0)
    })
  })

  describe('moderateComment — content checking (flags returned, registry update via service singleton)', () => {
    it('approves clean comment (flags only — no side-effect test)', () => {
      const comment = {
        id: 'c1',
        communityItemId: 'item1',
        userId: 'u1',
        content: 'Nice template!',
        moderationStatus: 'pending' as const,
        createdAt: Date.now(),
      }

      const result = service.moderateComment(comment)
      expect(result.approved).toBe(true)
      expect(result.flags.length).toBe(0)
    })

    it('flags spam comment (flags returned)', () => {
      const comment = {
        id: 'c2',
        communityItemId: 'item1',
        userId: 'u1',
        content: 'Click here to buy now! Get rich!',
        moderationStatus: 'pending' as const,
        createdAt: Date.now(),
      }

      const result = service.moderateComment(comment)
      expect(result.approved).toBe(false)
      expect(result.flags.length).toBeGreaterThan(0)
    })
  })
})
