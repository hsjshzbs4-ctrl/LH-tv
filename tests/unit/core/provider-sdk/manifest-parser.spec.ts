// tests/unit/core/provider-sdk/manifest-parser.spec.ts — ManifestParser 单元测试
import { describe, it, expect } from 'vitest'
import { ManifestParser } from '@/core/provider-sdk/manifest/ManifestParser'

describe('ManifestParser', () => {
  const parser = new ManifestParser()

  describe('parse()', () => {
    it('should parse valid manifest', () => {
      const result = parser.parse({ id: 'my-plugin', name: 'My Plugin', version: '1.0.0', entry: 'index.ts' })
      expect(result).not.toBeNull()
      expect(result!.id).toBe('my-plugin')
      expect(result!.priority).toBe(100) // default
    })

    it('should parse with custom priority', () => {
      const result = parser.parse({ id: 'p', name: 'n', version: '1.0.0', entry: 'e', priority: 200 })
      expect(result!.priority).toBe(200)
    })

    it('should return null for null input', () => {
      expect(parser.parse(null)).toBeNull()
    })

    it('should return null for undefined input', () => {
      expect(parser.parse(undefined)).toBeNull()
    })

    it('should return null for missing id', () => {
      expect(parser.parse({ name: 'n', version: '1.0.0', entry: 'e' })).toBeNull()
    })

    it('should return null for missing name', () => {
      expect(parser.parse({ id: 'p', version: '1.0.0', entry: 'e' })).toBeNull()
    })

    it('should return null for missing version', () => {
      expect(parser.parse({ id: 'p', name: 'n', entry: 'e' })).toBeNull()
    })

    it('should return null for missing entry', () => {
      expect(parser.parse({ id: 'p', name: 'n', version: '1.0.0' })).toBeNull()
    })

    it('should use default author when missing', () => {
      const result = parser.parse({ id: 'p', name: 'n', version: '1.0.0', entry: 'e' })
      expect(result!.author).toBe('Unknown')
    })

    it('should use default description when missing', () => {
      const result = parser.parse({ id: 'p', name: 'n', version: '1.0.0', entry: 'e' })
      expect(result!.description).toBe('')
    })
  })

  describe('validate()', () => {
    const valid = { id: 'my-plugin', name: 'My Plugin', version: '1.0.0', author: 'Me', description: 'Test', priority: 100, entry: 'index.ts' }

    it('should return no errors for valid manifest', () => {
      expect(parser.validate(valid)).toEqual([])
    })

    it('should reject invalid id format', () => {
      const errors = parser.validate({ ...valid, id: 'My Plugin' })
      expect(errors.some(e => e.includes('Invalid id'))).toBe(true)
    })

    it('should reject missing name', () => {
      const errors = parser.validate({ ...valid, name: '' })
      expect(errors).toContain('name is required')
    })

    it('should reject invalid version format', () => {
      const errors = parser.validate({ ...valid, version: 'not-semver' })
      expect(errors.some(e => e.includes('Invalid version'))).toBe(true)
    })

    it('should reject missing entry', () => {
      const errors = parser.validate({ ...valid, entry: '' })
      expect(errors).toContain('entry is required')
    })
  })
})
