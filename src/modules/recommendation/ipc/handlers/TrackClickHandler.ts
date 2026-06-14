// modules/recommendation/ipc/handlers/TrackClickHandler.ts — CE9-E

import type { TrackEventResponse } from '../contracts/RecommendationIPCContracts'
import { toSafeError } from '../errors/IPCErrors'
import type { TrackRecommendationClickUseCase } from '../../application/use-cases/TrackRecommendationClickUseCase'

export class TrackClickHandler {
  constructor(private useCase: TrackRecommendationClickUseCase) {}

  async handle(feedId: string, sectionId: string, mediaId: string, position: number): Promise<TrackEventResponse> {
    try {
      await this.useCase.execute(feedId, sectionId, mediaId, position)
      return { version: 1, success: true }
    } catch (err) { return { version: 1, success: false, error: toSafeError(err).safeMessage } }
  }
}
