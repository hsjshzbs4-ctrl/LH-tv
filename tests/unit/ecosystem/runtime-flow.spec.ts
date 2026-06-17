// tests/unit/ecosystem/runtime-flow.spec.ts — Runtime Flow 完整性测试
// 验证唯一合法路径: Extension → Runtime → Permission → HostAPI
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock feature flag manager
vi.mock('@platform/flags', () => ({
  featureFlagManager: {
    isEnabled: vi.fn().mockReturnValue(true),
  },
  FeatureState: { OFF: 'OFF', INTERNAL: 'INTERNAL', PUBLIC: 'PUBLIC' },
}))

import {
  ExtensionRuntime,
  ExtensionState,
  ExtensionType,
  PermissionManager,
  SandboxManager,
  HostAPI,
  ExtensionCertificationPolicy,
  CertificationLevel,
} from '@ecosystem/index'

const validManifest = {
  id: 'acme.runtime-test',
  name: 'Runtime Test Extension',
  version: '1.0.0',
  publisher: { id: 'acme', name: 'Acme Corp' },
  signature: 'sha256:abc123def456abc123def456abc123def456',
  runtimeVersion: '3.0.0',
  type: ExtensionType.PLUGIN,
  entry: './index.js',
  description: 'Runtime flow test',
  permissions: [
    { id: 'storage.read', reason: 'Read config' },
    { id: 'notification.send', reason: 'Notify user' },
  ],
  capabilities: [{ id: 'host.storage' }],
  dependencies: [],
}

describe('Runtime Flow (PB7-S3)', () => {
  let runtime: ExtensionRuntime
  let pm: PermissionManager
  let sandbox: SandboxManager

  beforeEach(async () => {
    runtime = new ExtensionRuntime()
    pm = new PermissionManager()
    sandbox = new SandboxManager()

    await runtime.initialize()
  })

  it('verifies: Extension → Runtime.load() → validate → register → sandbox → RUNNING', async () => {
    const result = await runtime.load(validManifest)
    expect(result.success).toBe(true)
    expect(result.instance).toBeDefined()
    expect(result.instance!.state).toBe(ExtensionState.RUNNING)
  })

  it('verifies: Extension → Runtime.stop() → STOPPED', async () => {
    await runtime.load(validManifest)
    const result = await runtime.stop(validManifest.id)
    expect(result.success).toBe(true)
    expect(runtime.get(validManifest.id)!.state).toBe(ExtensionState.STOPPED)
  })

  it('verifies: Extension → Runtime.restart() → STOPPED → RUNNING', async () => {
    // 使用唯一 ID 避免 singleton 状态污染
    const restartManifest = { ...validManifest, id: 'test.restart-ext' }
    await runtime.load(restartManifest)
    await runtime.restart(restartManifest.id)
    expect(runtime.get(restartManifest.id)!.state).toBe(ExtensionState.RUNNING)
  })

  it('verifies: Extension → Runtime.unload() → full cleanup', async () => {
    await runtime.load(validManifest)
    const result = await runtime.unload(validManifest.id)
    expect(result.success).toBe(true)
    expect(runtime.get(validManifest.id)).toBeNull()
  })

  it('rejects invalid manifest', async () => {
    const result = await runtime.load({ invalid: true })
    expect(result.success).toBe(false)
    expect(result.error).toContain('validation failed')
  })

  it('lists running extensions', async () => {
    // 使用唯一 ID 避免 singleton 状态污染
    const ext1 = { ...validManifest, id: 'test.list-ext-1' }
    const ext2 = { ...validManifest, id: 'test.list-ext-2' }

    // 记录测试前的运行数
    const before = runtime.listRunning().length

    await runtime.load(ext1)
    await runtime.load(ext2)

    const running = runtime.listRunning()
    // 新增了 2 个运行中的扩展
    expect(running.length - before).toBe(2)
  })

  it('prevents sandbox API access without permission', () => {
    sandbox.create(validManifest.id)
    const checkResult = sandbox.checkAPIAccess(validManifest.id, 'network')
    expect(checkResult.allowed).toBe(false)
  })

  it('allows sandbox API access with correct allowlist', () => {
    sandbox.create(validManifest.id)
    const checkResult = sandbox.checkAPIAccess(validManifest.id, 'storage')
    expect(checkResult.allowed).toBe(true)
  })

  it('provides runtime stats', async () => {
    // 使用唯一 ID 避免 singleton 状态污染
    const statsManifest = { ...validManifest, id: 'test.stats-ext' }
    await runtime.load(statsManifest)
    const stats = runtime.stats()
    expect(stats.available).toBe(true)
    // 至少 1 个运行中的扩展 (可能有之前测试残留)
    expect(stats.lifecycle[ExtensionState.RUNNING]).toBeGreaterThanOrEqual(1)
  })
})

describe('ExtensionCertificationPolicy', () => {
  it('classifies certified extension as DEVELOPER', () => {
    const result = ExtensionCertificationPolicy.evaluate(validManifest)
    expect(result.passed).toBe(true)
    expect(result.level).toBe(CertificationLevel.DEVELOPER)
  })

  it('classifies unsigned extension as UNCERTIFIED', () => {
    const unsigned = { ...validManifest, signature: '' }
    const result = ExtensionCertificationPolicy.evaluate(unsigned)
    expect(result.passed).toBe(false)
    expect(result.level).toBe(CertificationLevel.UNCERTIFIED)
  })

  it('classifies dangerous permission as DANGEROUS security', () => {
    const dangerous = {
      ...validManifest,
      permissions: [{ id: 'filesystem.write', reason: 'save' }],
    }
    const result = ExtensionCertificationPolicy.evaluate(dangerous)
    expect(result.passed).toBe(false)
  })
})

describe('HostAPI Security', () => {
  it('requires sandbox allowlist check before execution', async () => {
    const hostAPI = new HostAPI()
    const response = await hostAPI.handle({
      extensionId: 'unknown.ext',
      api: 'network',
      method: 'fetch',
      params: {},
    })
    expect(response.success).toBe(false)
    expect(response.error).toContain('Sandbox denied')
  })
})
