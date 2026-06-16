// tests/unit/content/content-types.spec.ts — Content Types 类型验证
import { describe, it, expect } from 'vitest'
import {
  CATEGORY_SUB_MAP,
  CATEGORY_LABELS,
} from '@/content/contentTypes'

describe('Content Types', () => {
  describe('CATEGORY_SUB_MAP', () => {
    it('should have all 5 categories', () => {
      const keys = Object.keys(CATEGORY_SUB_MAP)
      expect(keys).toHaveLength(5)
      expect(keys).toContain('movie')
      expect(keys).toContain('tv')
      expect(keys).toContain('anime')
      expect(keys).toContain('variety')
      expect(keys).toContain('documentary')
    })

    it('should have sub-categories for each category', () => {
      for (const cat of Object.keys(CATEGORY_SUB_MAP) as Array<keyof typeof CATEGORY_SUB_MAP>) {
        expect(CATEGORY_SUB_MAP[cat].length).toBeGreaterThan(0)
      }
    })
  })

  describe('CATEGORY_LABELS', () => {
    it('should have labels for all categories', () => {
      expect(CATEGORY_LABELS.movie).toBe('电影')
      expect(CATEGORY_LABELS.tv).toBe('电视剧')
      expect(CATEGORY_LABELS.anime).toBe('动漫')
      expect(CATEGORY_LABELS.variety).toBe('综艺')
      expect(CATEGORY_LABELS.documentary).toBe('纪录片')
    })
  })
})
