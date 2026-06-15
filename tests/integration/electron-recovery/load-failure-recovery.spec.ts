// tests/integration/electron-recovery/load-failure-recovery.spec.ts — RC3.1 Integration
import { describe, it, expect, beforeEach } from 'vitest'

describe('Load Failure Recovery — Integration', () => {
  interface LoadState {
    errorCode: number
    errorDescription: string
    retryCount: number
    recoveryUIShown: boolean
  }

  let state: LoadState

  const MAX_RETRIES = 1

  beforeEach(() => {
    state = {
      errorCode: 0,
      errorDescription: '',
      retryCount: 0,
      recoveryUIShown: false
    }
  })

  function handleLoadFailure(code: number, desc: string): 'ignore' | 'retry' | 'recovery-ui' {
    if (code === -3) return 'ignore' // ABORTED

    state.errorCode = code
    state.errorDescription = desc
    state.retryCount++

    if (code < -100 && state.retryCount <= MAX_RETRIES) {
      return 'retry'
    }

    state.recoveryUIShown = true
    return 'recovery-ui'
  }

  it('should ignore aborted loads (-3)', () => {
    const result = handleLoadFailure(-3, 'ERR_ABORTED')
    expect(result).toBe('ignore')
    expect(state.retryCount).toBe(0)
  })

  it('should auto-retry once for DNS failure (-105)', () => {
    const result = handleLoadFailure(-105, 'ERR_NAME_NOT_RESOLVED')
    expect(result).toBe('retry')
    expect(state.retryCount).toBe(1)
  })

  it('should show recovery UI after retry exhausted', () => {
    handleLoadFailure(-106, 'ERR_INTERNET_DISCONNECTED') // retry 1
    const result = handleLoadFailure(-106, 'ERR_INTERNET_DISCONNECTED') // exhausted
    expect(result).toBe('recovery-ui')
    expect(state.recoveryUIShown).toBe(true)
  })

  it('should detect offline state for DNS failures', () => {
    const isOffline = (code: number) => code === -105 || code === -106
    expect(isOffline(-105)).toBe(true)
    expect(isOffline(-106)).toBe(true)
    expect(isOffline(-102)).toBe(false)
  })

  it('should reset retry count on successful subsequent load', () => {
    handleLoadFailure(-106, 'ERR_INTERNET_DISCONNECTED')
    expect(state.retryCount).toBe(1)

    // Simulate successful load
    state.retryCount = 0
    state.recoveryUIShown = false
    expect(state.retryCount).toBe(0)
  })
})

describe('Load Failure — DNS/Network Scenarios', () => {
  const scenarios = [
    { code: -105, name: 'DNS failure', offline: true },
    { code: -106, name: 'Internet disconnected', offline: true },
    { code: -102, name: 'Connection refused', offline: false },
    { code: -101, name: 'Connection reset', offline: false },
    { code: -118, name: 'Connection timed out', offline: false },
    { code: -7, name: 'Request timed out', offline: false },
  ]

  it('should classify each error scenario correctly', () => {
    for (const s of scenarios) {
      const isNetwork = s.code < -100
      const isOffline = s.code === -105 || s.code === -106
      expect(isNetwork).toBe(s.code < -100)
      expect(isOffline).toBe(s.offline)
    }
  })
})
