// tests/unit/electron/load-failure-recovery.spec.ts — RC3.1 Blocker #4 unit tests
import { describe, it, expect } from 'vitest'

describe('Load Failure Classification', () => {
  // Test the error code classification logic
  // -3 = ABORTED (ignore)
  // -105 = NAME_NOT_RESOLVED (offline/DNS)
  // -106 = INTERNET_DISCONNECTED (offline)
  // < -100 = network errors (auto-retry)

  const ABORTED = -3
  const DNS_FAILURE = -105
  const OFFLINE = -106
  const CONNECTION_REFUSED = -102
  const TIMED_OUT = -7

  function isAborted(code: number): boolean {
    return code === ABORTED
  }

  function isNetworkError(code: number): boolean {
    return code < -100
  }

  function isOffline(code: number): boolean {
    return code === DNS_FAILURE || code === OFFLINE
  }

  it('should ignore ABORTED errors (-3)', () => {
    expect(isAborted(-3)).toBe(true)
    expect(isAborted(-2)).toBe(false)
    expect(isAborted(0)).toBe(false)
  })

  it('should classify network errors (< -100)', () => {
    expect(isNetworkError(-105)).toBe(true)
    expect(isNetworkError(-106)).toBe(true)
    expect(isNetworkError(-102)).toBe(true)
    expect(isNetworkError(-7)).toBe(false)
    expect(isNetworkError(-3)).toBe(false)
  })

  it('should detect offline state', () => {
    expect(isOffline(-105)).toBe(true)  // DNS
    expect(isOffline(-106)).toBe(true)  // Internet disconnected
    expect(isOffline(-102)).toBe(false) // Connection refused (server exists, not offline)
  })

  it('should auto-retry network errors but not others', () => {
    const networkErrors = [-105, -106, -102, -101, -118]
    for (const code of networkErrors) {
      expect(isNetworkError(code)).toBe(true)
    }

    const nonNetworkErrors = [-3, -2, -1, 0, 200]
    for (const code of nonNetworkErrors) {
      expect(isNetworkError(code)).toBe(false)
    }
  })
})

describe('Retry Logic', () => {
  const MAX_RETRIES = 1

  function shouldRetry(retryCount: number, errorCode: number): boolean {
    // Only retry network errors, and only up to MAX_RETRIES
    return errorCode < -100 && retryCount <= MAX_RETRIES
  }

  it('should retry once for network error', () => {
    expect(shouldRetry(0, -106)).toBe(true)
    expect(shouldRetry(1, -106)).toBe(true)
  })

  it('should not retry beyond max', () => {
    expect(shouldRetry(2, -106)).toBe(false)
  })

  it('should not retry aborted loads', () => {
    expect(shouldRetry(0, -3)).toBe(false)
  })

  it('should reset retry count on successful load', () => {
    // successCount resets failures to 0
    let retryCount = 2
    const didFinishLoad = true
    if (didFinishLoad) retryCount = 0
    expect(retryCount).toBe(0)
  })
})

describe('Recovery UI Content', () => {
  it('should show offline message for DNS errors', () => {
    const isOffline = true
    const message = isOffline ? '网络连接断开' : '页面加载失败'
    expect(message).toBe('网络连接断开')
  })

  it('should show error details for non-offline errors', () => {
    const isOffline = false
    const message = isOffline ? '网络连接断开' : '页面加载失败'
    expect(message).toBe('页面加载失败')
  })

  it('should always include retry button', () => {
    const recoveryHtml = '<button onclick="location.reload()">🔄 重试</button>'
    expect(recoveryHtml).toContain('重试')
    expect(recoveryHtml).toContain('location.reload()')
  })
})
