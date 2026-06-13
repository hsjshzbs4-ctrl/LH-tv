// tests/architecture/plugin-ready.spec.ts — Plugin SDK 独立发布就绪验证
// P5.0: 验证 provider-sdk 不依赖运行时层
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

describe('Plugin SDK Ready Guards', () => {
  describe('provider-sdk independence', () => {
    it('should NOT depend on providers', () => {
      const deps = getDeps('src/core/provider-sdk')
      if (deps.size === 0) return

      const violations: string[] = []
      for (const [file, imports] of deps) {
        for (const imp of imports) {
          const norm = imp.replace(/\\/g, '/')
          if (norm.includes('core/providers/') && !norm.includes('provider-sdk')) {
            violations.push(`${file} → ${imp}`)
          }
        }
      }
      expect(violations).toEqual([])
    })

    it('should NOT depend on provider-host', () => {
      const deps = getDeps('src/core/provider-sdk')
      if (deps.size === 0) return

      const violations: string[] = []
      for (const [file, imports] of deps) {
        for (const imp of imports) {
          if (imp.includes('provider-host')) {
            violations.push(`${file} → ${imp}`)
          }
        }
      }
      expect(violations).toEqual([])
    })
  })

  describe('provider-contracts purity', () => {
    it('should have zero business dependencies', () => {
      const deps = getDeps('src/provider-contracts')
      if (deps.size === 0) return

      const violations: string[] = []
      for (const [file, imports] of deps) {
        for (const imp of imports) {
          const norm = imp.replace(/\\/g, '/')
          if (norm.includes('core/') || norm.includes('electron/') || norm.includes('stores/') || norm.includes('views/')) {
            violations.push(`${file} → ${imp}`)
          }
        }
      }
      expect(violations).toEqual([])
    })
  })

  describe('All 3 layers importable', () => {
    it('should load provider-contracts', async () => {
      const mod = await import('@provider-contracts')
      expect(mod).toBeDefined()
    })

    it('should load provider-sdk', async () => {
      const mod = await import('@/core/provider-sdk')
      expect(mod).toBeDefined()
    })

    it('should load provider-host', async () => {
      const mod = await import('@/provider-host')
      expect(mod.providerHost).toBeDefined()
    })
  })
})
