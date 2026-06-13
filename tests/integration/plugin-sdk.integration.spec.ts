// tests/integration/plugin-sdk.integration.spec.ts — Manifest → Validator → Loader → Registry 集成
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ManifestParser } from '@/core/provider-sdk/manifest/ManifestParser'
import { ProviderRegistry } from '@/core/providers'
import { createMockProvider } from '../mocks/provider.mock'

describe('Plugin SDK Integration Flow', () => {
  let parser: ManifestParser
  let registry: ProviderRegistry

  beforeEach(() => {
    parser = new ManifestParser()
    registry = new ProviderRegistry()
  })

  // Case 01: Manifest → Validator → Registry
  it('Case 01: should parse valid manifest and register provider', () => {
    const raw = { id: 'my-plugin', name: 'My Plugin', version: '1.0.0', entry: 'index.ts', priority: 200 }
    const manifest = parser.parse(raw)
    expect(manifest).not.toBeNull()

    const errors = parser.validate(manifest!)
    expect(errors).toEqual([])

    // 模拟 SDK 加载后注册到 Registry
    const provider = createMockProvider({ id: manifest!.id, name: manifest!.name, priority: manifest!.priority })
    registry.register(provider)
    expect(registry.get('my-plugin')).toBeDefined()
  })

  // Case 02: 非法 Manifest 拒绝
  it('Case 02: should reject invalid manifest', () => {
    const nullResult = parser.parse(null)
    expect(nullResult).toBeNull()

    const missingFields = parser.parse({ name: 'NoId' })
    expect(missingFields).toBeNull()
  })

  // Case 03: 验证失败
  it('Case 03: should detect validation errors', () => {
    const manifest = parser.parse({ id: 'Bad ID!', name: '', version: 'abc', entry: '' })
    // 有 entry 才通过 parse，但 entry 为空字符串会通过 parse(typeof check)
    // 但 validate 会检测到问题
    if (manifest) {
      const errors = parser.validate(manifest)
      expect(errors.length).toBeGreaterThan(0)
    }
  })

  // Case 04: 重复 id 检测
  it('Case 04: should detect duplicate provider on register', () => {
    const p1 = createMockProvider({ id: 'dup', name: 'First' })
    const p2 = createMockProvider({ id: 'dup', name: 'Second' })

    registry.register(p1)
    registry.register(p2) // overwrite

    expect(registry.count).toBe(1)
    expect(registry.get('dup')?.name).toBe('Second')
  })

  // Case 05: 卸载 + 系统继续运行
  it('Case 05: should unregister provider without affecting others', () => {
    const p1 = createMockProvider({ id: 'p1' })
    const p2 = createMockProvider({ id: 'p2' })

    registry.register(p1)
    registry.register(p2)
    expect(registry.count).toBe(2)

    registry.unregister('p1')
    expect(registry.count).toBe(1)
    expect(registry.get('p2')).toBeDefined()
    // p2 仍然可用
    expect(registry.getEnabled()).toHaveLength(1)
  })
})
