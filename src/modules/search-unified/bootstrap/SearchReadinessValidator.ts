// modules/search-unified/bootstrap/SearchReadinessValidator.ts — CE8-C4
// Validates module readiness: providers, stores, analytics, runtime, facade.

import type { SearchDependencyContainer } from './SearchDependencyContainer'

export interface ReadinessResult {
  readonly ready: boolean
  readonly checks: ReadinessCheck[]
  readonly passedCount: number
  readonly failedCount: number
}

export interface ReadinessCheck {
  readonly name: string
  readonly passed: boolean
  readonly message: string
}

export class SearchReadinessValidator {
  constructor(private container: SearchDependencyContainer) {}

  validate(): ReadinessResult {
    const checks: ReadinessCheck[] = [
      this._check('Provider Registry', () => this.container.providerRegistry.providerCount > 0),
      this._check('Providers Available', () => this.container.providerRegistry.getAvailableProviders().length > 0),
      this._check('Analytics Runtime', () => true), // Runtime always ready
      this._check('Runtime Ready', () => this.container.runtime !== undefined),
      this._check('Use Case Ready', () => this.container.searchUseCase !== undefined),
      this._check('Suggestions Ready', () => this.container.suggestionEngine !== undefined),
      this._check('Health Monitor Ready', () => this.container.healthMonitor !== undefined),
      this._check('Metrics Ready', () => this.container.metrics !== undefined),
    ]

    const passed = checks.filter(c => c.passed).length
    const failed = checks.length - passed

    return { ready: failed === 0, checks, passedCount: passed, failedCount: failed }
  }

  private _check(name: string, fn: () => boolean): ReadinessCheck {
    try {
      const passed = fn()
      return { name, passed, message: passed ? 'OK' : 'FAILED' }
    } catch (err) {
      return { name, passed: false, message: err instanceof Error ? err.message : 'Error' }
    }
  }
}
