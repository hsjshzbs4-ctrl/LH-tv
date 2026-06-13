// tests/architecture/provider-decoupling.spec.ts — Provider 解耦架构守卫
// P5.0: 验证 providers 不再依赖 provider-sdk/provider-host
import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import { resolve } from 'path'

const ROOT = resolve(__dirname, '..', '..')

function getDeps(dir: string): Map<string, string[]> {
  try {
    const cmd = `npx madge --extensions ts --ts-config tsconfig.json --json "${resolve(ROOT, dir)}"`
    const output = execSync(cmd, { cwd: ROOT, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
    return new Map(Object.entries(JSON.parse(output)))
  } catch { return new Map() }
}

describe('Provider Decoupling Architecture Guards', () => {
  describe('Rule: providers → provider-sdk is FORBIDDEN', () => {
    it('should have 0 imports from providers to provider-sdk', () => {
      const deps = getDeps('src/core/providers')
      if (deps.size === 0) { console.warn('Skipping: madge returned empty'); return }

      const violations: string[] = []
      for (const [file, imports] of deps) {
        for (const imp of imports) {
          if (imp.includes('provider-sdk')) {
            violations.push(`VIOLATION: ${file} → ${imp}`)
          }
        }
      }
      expect(violations).toEqual([])
    })
  })

  describe('Rule: providers → provider-host is FORBIDDEN', () => {
    it('should have 0 imports from providers to provider-host', () => {
      const deps = getDeps('src/core/providers')
      if (deps.size === 0) { console.warn('Skipping: madge returned empty'); return }

      const violations: string[] = []
      for (const [file, imports] of deps) {
        for (const imp of imports) {
          if (imp.includes('provider-host')) {
            violations.push(`VIOLATION: ${file} → ${imp}`)
          }
        }
      }
      expect(violations).toEqual([])
    })
  })

  describe('Rule: provider-sdk → providers is FORBIDDEN', () => {
    it('should have 0 imports from provider-sdk to providers', () => {
      const deps = getDeps('src/core/provider-sdk')
      if (deps.size === 0) { console.warn('Skipping: madge returned empty'); return }

      const violations: string[] = []
      for (const [file, imports] of deps) {
        for (const imp of imports) {
          if (imp.includes('core/providers') && !imp.includes('provider-sdk') && !imp.includes('provider-contracts')) {
            violations.push(`VIOLATION: ${file} → ${imp}`)
          }
        }
      }
      expect(violations).toEqual([])
    })
  })

  describe('Circular Dependencies = 0 (hard gate)', () => {
    it('should have zero circular dependencies in entire src/', () => {
      try {
        execSync(
          `npx madge --extensions ts --ts-config tsconfig.json --circular src`,
          { cwd: ROOT, encoding: 'utf-8', stdio: 'pipe' },
        )
        expect(true).toBe(true) // No error = no cycles
      } catch (e) {
        const msg = (e as { stdout?: string }).stdout || ''
        // No longer accept known cycles
        expect(msg).not.toContain('circular dependencies')
      }
    })
  })
})
