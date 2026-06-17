// tests/unit/ecosystem/manifest-validation.spec.ts — Manifest 校验测试
import { describe, it, expect } from 'vitest'
import { validateManifest, ExtensionType } from '@ecosystem/contracts'

const validManifest = {
  id: 'acme.test-plugin',
  name: 'Test Plugin',
  version: '1.0.0',
  publisher: { id: 'acme', name: 'Acme Corp' },
  signature: 'sha256:abcdef1234567890abcdef1234567890',
  runtimeVersion: '3.0.0',
  type: ExtensionType.PLUGIN,
  entry: './index.js',
  description: 'A test plugin',
  permissions: [{ id: 'storage.read', reason: 'Store plugin data' }],
  capabilities: [{ id: 'host.storage' }],
  dependencies: [],
}

describe('validateManifest', () => {
  it('validates a complete manifest', () => {
    const result = validateManifest(validManifest)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects null input', () => {
    const result = validateManifest(null)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Manifest must be a non-null object')
  })

  it('rejects empty object', () => {
    const result = validateManifest({})
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('requires id field', () => {
    const m = { ...validManifest, id: undefined }
    const result = validateManifest(m)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('id'))).toBe(true)
  })

  it('requires name field', () => {
    const m = { ...validManifest, name: undefined }
    const result = validateManifest(m)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('name'))).toBe(true)
  })

  it('requires version field', () => {
    const m = { ...validManifest, version: undefined }
    const result = validateManifest(m)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('version'))).toBe(true)
  })

  it('requires entry field', () => {
    const m = { ...validManifest, entry: undefined }
    const result = validateManifest(m)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('entry'))).toBe(true)
  })

  it('warns on missing signature', () => {
    const m = { ...validManifest, signature: '' }
    const result = validateManifest(m)
    expect(result.warnings.some((w) => w.includes('signature'))).toBe(true)
  })

  it('warns on bad version format', () => {
    const m = { ...validManifest, version: 'v1' }
    const result = validateManifest(m)
    expect(result.warnings.some((w) => w.includes('semantic'))).toBe(true)
  })

  it('validates publisher structure', () => {
    const m = { ...validManifest, publisher: { name: 'No ID' } }
    const result = validateManifest(m)
    expect(result.valid).toBe(false)
  })

  it('rejects invalid type', () => {
    const m = { ...validManifest, type: 'invalid_type' }
    const result = validateManifest(m)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('type'))).toBe(true)
  })
})
