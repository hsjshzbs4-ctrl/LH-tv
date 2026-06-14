// modules/search-unified/ipc/health/SearchIPCHealthEndpoint.ts — CE8-D
// Diagnostics endpoint. Development-only — can be feature-flagged in production.

import type { UnifiedSearchFacade } from '../../bootstrap/UnifiedSearchFacade'

export interface HealthSnapshot {
  readonly moduleState: string
  readonly providers: Array<{ id: string; available: boolean }>
  readonly readiness: { ready: boolean; passedCount: number; failedCount: number }
}

export class SearchIPCHealthEndpoint {
  constructor(private facade: UnifiedSearchFacade) {}

  getHealth(): HealthSnapshot {
    const status = this.facade.getStatus()
    const readiness = this.facade.validateReadiness()

    return {
      moduleState: status.state,
      providers: status.providers,
      readiness: {
        ready: readiness.ready,
        passedCount: readiness.passedCount,
        failedCount: readiness.failedCount,
      },
    }
  }
}
