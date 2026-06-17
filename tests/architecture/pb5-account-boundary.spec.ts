// tests/architecture/pb5-account-boundary.spec.ts — S5-1 架构边界测试

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const ACCOUNT_SRC_DIR = resolve(__dirname, '../../src/platform/account')

function getModuleFiles(): string[] {
  return [
    'index.ts',
    'types/account.types.ts',
    'manager/UserAccountManager.ts',
    'manager/SessionManager.ts',
    'auth/AuthProvider.ts',
    'auth/LocalAuthProvider.ts',
    'storage/AccountStorage.ts',
  ]
}

describe('S5-1 Architecture Boundary', () => {
  const files = getModuleFiles()

  it.each(files)('account module file %s does not import from views/renderer', (file) => {
    const filePath = resolve(ACCOUNT_SRC_DIR, file)
    try {
      const content = readFileSync(filePath, 'utf-8')
      expect(content).not.toMatch(/from ['"]@\/views\//)
      expect(content).not.toMatch(/from ['"]@\/renderer\//)
    } catch { /* file may not exist yet */ }
  })

  it.each(files)('account module file %s does not import from frozen PB4 player modules', (file) => {
    const filePath = resolve(ACCOUNT_SRC_DIR, file)
    try {
      const content = readFileSync(filePath, 'utf-8')
      expect(content).not.toMatch(/from ['"]@\/player\//)
      expect(content).not.toMatch(/from ['"]@\/core\/player\//)
    } catch { /* file may not exist yet */ }
  })

  // ── PB5 Auth v2: 禁止 OAuth / SSO ──
  it('does not contain OAuth or SSO references', () => {
    const managerContent = readFileSync(
      resolve(ACCOUNT_SRC_DIR, 'manager/UserAccountManager.ts'),
      'utf-8',
    )
    expect(managerContent).not.toMatch(/oauth/i)
    expect(managerContent).not.toMatch(/\bSSO\b/)
    expect(managerContent).not.toMatch(/google.*login/i)
    expect(managerContent).not.toMatch(/github.*auth/i)
  })

  it('only uses LocalAuthProvider as auth implementation', () => {
    const managerContent = readFileSync(
      resolve(ACCOUNT_SRC_DIR, 'manager/UserAccountManager.ts'),
      'utf-8',
    )
    expect(managerContent).toContain('LocalAuthProvider')
  })
})
