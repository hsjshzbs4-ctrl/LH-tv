// modules/recommendation/ipc/validators/IPCValidators.ts — CE9-E

import type { GenerateFeedRequest, TrackEventRequest } from '../contracts/RecommendationIPCContracts'
import { IPC_CONTRACT_VERSION } from '../contracts/RecommendationIPCContracts'

export function validateGenerateFeedRequest(req: unknown): string[] {
  const errors: string[] = []
  const r = req as GenerateFeedRequest
  if (!r) return ['Request is required']
  if (r.version !== IPC_CONTRACT_VERSION) errors.push('Invalid version')
  if (!r.requestId) errors.push('requestId required')
  if (!r.userId) errors.push('userId required')
  if (!r.feedType) errors.push('feedType required')
  if (r.limit < 1 || r.limit > 100) errors.push('limit must be 1-100')
  if (r.offset < 0) errors.push('offset must be >= 0')
  return errors
}

export function validateTrackEventRequest(req: unknown): string[] {
  const errors: string[] = []
  const r = req as TrackEventRequest
  if (!r) return ['Request is required']
  if (r.version !== IPC_CONTRACT_VERSION) errors.push('Invalid version')
  if (!r.feedId) errors.push('feedId required')
  if (!r.mediaId) errors.push('mediaId required')
  const actions = ['click', 'play', 'favorite', 'dismiss', 'hide', 'watch-complete']
  if (!actions.includes(r.action)) errors.push(`Invalid action: ${r.action}`)
  return errors
}
