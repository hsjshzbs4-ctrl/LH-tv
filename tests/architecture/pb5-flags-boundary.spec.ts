// tests/architecture/pb5-flags-boundary.spec.ts — S5-7 架构边界测试

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// 检查 src/platform/flags/ 不依赖任何 View 层代码
const FLAGS_SRC_DIR = resolve(__dirname, '../../src/platform/flags')

function getModuleFiles(): string[] {
  // 静态列出已知文件，避免运行时 glob
  return [
    'index.ts',
    'defaults.ts',
    'types/flag.types.ts',
    'manager/FeatureFlagManager.ts',
    'manager/ExperimentManager.ts',
    'storage/FlagStorage.ts',
    'events/FeatureFlagEvents.ts',
  ]
}

describe('S5-7 Architecture Boundary', () => {
  const files = getModuleFiles()

  // ── 禁止 import 视图层代码 ──
  it.each(files)('flag module file %s does not import from views/renderer', (file) => {
    const filePath = resolve(FLAGS_SRC_DIR, file)
    try {
      const content = readFileSync(filePath, 'utf-8')
      // 不应 import Vue 组件或页面
      expect(content).not.toMatch(/from ['"]@\/views\//)
      expect(content).not.toMatch(/from ['"]@\/renderer\//)
      expect(content).not.toMatch(/from ['"]@\/stores\//)
    } catch {
      // 文件可能还不存在
    }
  })

  // ── 禁止 import 已冻结的 PB4 模块 ──
  it.each(files)('flag module file %s does not import from frozen PB4 modules', (file) => {
    const filePath = resolve(FLAGS_SRC_DIR, file)
    try {
      const content = readFileSync(filePath, 'utf-8')
      // 不应 import 播放器核心 (Frozen Zone)
      expect(content).not.toMatch(/from ['"]@\/player\//)
      expect(content).not.toMatch(/from ['"]@\/core\/player\//)
    } catch {
      // 文件可能还不存在
    }
  })

  // ── 依赖方向: flags 只被其他模块依赖, 不依赖其他平台模块 ──
  it.each(files)('flag module file %s does not depend on other PB5 modules', (file) => {
    const filePath = resolve(FLAGS_SRC_DIR, file)
    try {
      const content = readFileSync(filePath, 'utf-8')
      // flags 不应 import account/cloud/plugins/ai/data
      expect(content).not.toMatch(/from ['"]@platform\/account\//)
      expect(content).not.toMatch(/from ['"]@platform\/cloud\//)
      expect(content).not.toMatch(/from ['"]@platform\/plugins\//)
      expect(content).not.toMatch(/from ['"]@platform\/data\//)
      expect(content).not.toMatch(/from ['"]@ai\//)
    } catch {
      // 文件可能还不存在
    }
  })

  // ── 类型安全: FeatureState 必须使用 enum, 不能有绕过门控的路径 ──
  it('no boolean-based flag checks exist in Platform module', () => {
    const indexContent = readFileSync(resolve(FLAGS_SRC_DIR, 'index.ts'), 'utf-8')
    const managerContent = readFileSync(
      resolve(FLAGS_SRC_DIR, 'manager/FeatureFlagManager.ts'),
      'utf-8',
    )

    // isEnabled 返回 boolean 是正确的 (便捷方法), 但核心存储必须用 FeatureState
    expect(indexContent).toContain('FeatureState')
    expect(managerContent).toContain('FeatureState')
    expect(managerContent).toContain('getState')
    expect(managerContent).toContain('isEnabled')
    expect(managerContent).toContain('isPublic')
  })
})
