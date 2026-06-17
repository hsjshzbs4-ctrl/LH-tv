// tests/unit/community/community-policy.spec.ts — CommunityPolicy 单元测试
// PB7-S4: 权限矩阵验证 — 所有 action × certification level 组合

import { describe, it, expect } from 'vitest'
import {
  CommunityPolicy,
  CommunityAction,
  CommunityPermissionLevel,
} from '@community/index'
import { CertificationLevel } from '@ecosystem/index'

describe('CommunityPolicy', () => {
  // ── SAFE actions (all levels allowed) ──

  describe('SAFE actions — all certification levels allowed', () => {
    const levels = [
      CertificationLevel.UNCERTIFIED,
      CertificationLevel.COMMUNITY,
      CertificationLevel.DEVELOPER,
      CertificationLevel.OFFICIAL,
    ]

    it('allows Share for all levels', () => {
      for (const level of levels) {
        expect(CommunityPolicy.canShare(level)).toBe(true)
      }
    })

    it('allows Rate for all levels', () => {
      for (const level of levels) {
        expect(CommunityPolicy.canRate(level)).toBe(true)
      }
    })

    it('allows Comment for all levels', () => {
      for (const level of levels) {
        expect(CommunityPolicy.canComment(level)).toBe(true)
      }
    })

    it('SAFE actions do not require confirmation', () => {
      expect(CommunityPolicy.requiresConfirmation(CommunityAction.SHARE)).toBe(false)
      expect(CommunityPolicy.requiresConfirmation(CommunityAction.RATE)).toBe(false)
      expect(CommunityPolicy.requiresConfirmation(CommunityAction.COMMENT)).toBe(false)
    })
  })

  // ── PUBLISH (COMMUNITY+) ──

  describe('Publish — COMMUNITY and above', () => {
    it('UNCERTIFIED cannot publish', () => {
      expect(CommunityPolicy.canPublish(CertificationLevel.UNCERTIFIED)).toBe(false)
    })

    it('COMMUNITY can publish (with CONFIRM)', () => {
      expect(CommunityPolicy.canPublish(CertificationLevel.COMMUNITY)).toBe(true)
      const level = CommunityPolicy.getPermissionLevel(CertificationLevel.COMMUNITY, CommunityAction.PUBLISH_TEMPLATE)
      expect(level).toBe(CommunityPermissionLevel.CONFIRM)
    })

    it('DEVELOPER can publish (with CONFIRM)', () => {
      expect(CommunityPolicy.canPublish(CertificationLevel.DEVELOPER)).toBe(true)
    })

    it('OFFICIAL can publish (SAFE)', () => {
      expect(CommunityPolicy.canPublish(CertificationLevel.OFFICIAL)).toBe(true)
      const level = CommunityPolicy.getPermissionLevel(CertificationLevel.OFFICIAL, CommunityAction.PUBLISH_TEMPLATE)
      expect(level).toBe(CommunityPermissionLevel.SAFE)
    })

    it('Publish requires confirmation for non-OFFICIAL levels', () => {
      expect(CommunityPolicy.requiresConfirmation(CommunityAction.PUBLISH_TEMPLATE)).toBe(true)
      expect(CommunityPolicy.requiresConfirmation(CommunityAction.PUBLISH_AGENT)).toBe(true)
    })
  })

  // ── DELETE (OFFICIAL only) ──

  describe('Delete — OFFICIAL only', () => {
    it('UNCERTIFIED cannot delete', () => {
      expect(CommunityPolicy.canDelete(CertificationLevel.UNCERTIFIED)).toBe(false)
    })

    it('COMMUNITY cannot delete', () => {
      expect(CommunityPolicy.canDelete(CertificationLevel.COMMUNITY)).toBe(false)
    })

    it('DEVELOPER cannot delete', () => {
      expect(CommunityPolicy.canDelete(CertificationLevel.DEVELOPER)).toBe(false)
    })

    it('OFFICIAL can delete', () => {
      expect(CommunityPolicy.canDelete(CertificationLevel.OFFICIAL)).toBe(true)
    })
  })

  // ── MODIFY SHARED CONFIG ──

  describe('Modify Shared Config — COMMUNITY+ (CONFIRM)', () => {
    it('UNCERTIFIED cannot modify shared config', () => {
      expect(CommunityPolicy.canModifySharedConfig(CertificationLevel.UNCERTIFIED)).toBe(false)
    })

    it('COMMUNITY can modify shared config (CONFIRM)', () => {
      expect(CommunityPolicy.canModifySharedConfig(CertificationLevel.COMMUNITY)).toBe(true)
    })

    it('OFFICIAL can modify shared config (SAFE)', () => {
      expect(CommunityPolicy.canModifySharedConfig(CertificationLevel.OFFICIAL)).toBe(true)
    })
  })

  // ── validate() method ──

  describe('validate()', () => {
    it('returns allowed=false for FORBIDDEN actions', () => {
      const result = CommunityPolicy.validate(CertificationLevel.UNCERTIFIED, CommunityAction.DELETE_SHARED_CONTENT)
      expect(result.allowed).toBe(false)
      expect(result.level).toBe(CommunityPermissionLevel.FORBIDDEN)
      expect(result.reason).toContain('FORBIDDEN')
    })

    it('returns allowed=true for SAFE actions', () => {
      const result = CommunityPolicy.validate(CertificationLevel.OFFICIAL, CommunityAction.SHARE)
      expect(result.allowed).toBe(true)
      expect(result.level).toBe(CommunityPermissionLevel.SAFE)
    })

    it('returns allowed=true for CONFIRM actions', () => {
      const result = CommunityPolicy.validate(CertificationLevel.COMMUNITY, CommunityAction.PUBLISH_TEMPLATE)
      expect(result.allowed).toBe(true)
      expect(result.level).toBe(CommunityPermissionLevel.CONFIRM)
    })
  })

  // ── Edge cases ──

  describe('edge cases', () => {
    it('getPermissionLevel returns FORBIDDEN for unknown combinations', () => {
      // @ts-expect-error — testing invalid input
      const level = CommunityPolicy.getPermissionLevel('invalid', CommunityAction.SHARE)
      expect(level).toBe(CommunityPermissionLevel.FORBIDDEN)
    })

    it('full permission matrix covers all actions', () => {
      const actions = Object.values(CommunityAction)
      const levels = Object.values(CertificationLevel)

      for (const level of levels) {
        for (const action of actions) {
          const result = CommunityPolicy.getPermissionLevel(level, action)
          expect(Object.values(CommunityPermissionLevel)).toContain(result)
        }
      }
    })
  })
})
