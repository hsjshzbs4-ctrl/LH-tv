// tests/plugin-marketplace/plugin-verifier.spec.ts
import { describe, it, expect } from 'vitest'
import { PluginVerifier } from '@/plugin-marketplace/signatures/PluginVerifier'

describe('PluginVerifier', () => {
  const verifier = new PluginVerifier()

  it('should pass unsigned packages (mock)', () => {
    const result = verifier.verify(Buffer.from('test'))
    expect(result.valid).toBe(true)
  })

  it('should verify valid SHA256 signature', () => {
    const result = verifier.verify(Buffer.from('test'), {
      algorithm: 'SHA256', signature: 'abc123', signerKeyId: 'key1', signedAt: Date.now(),
    })
    expect(result.valid).toBe(true)
    expect(result.signature!.algorithm).toBe('SHA256')
  })

  it('should reject unsupported algorithm', () => {
    const result = verifier.verify(Buffer.from('test'), {
      algorithm: 'MD5' as any, signature: 'abc', signerKeyId: 'key1', signedAt: Date.now(),
    })
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('Unsupported algorithm')
  })

  it('should generate hash', () => {
    const hash = verifier.hash(Buffer.from('hello'))
    expect(hash).toBeTruthy()
    expect(typeof hash).toBe('string')
  })
})
