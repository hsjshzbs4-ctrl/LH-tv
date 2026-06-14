// modules/recommendation/ipc/handlers/TrackConsumeHandler.ts — CE9-E

import type { TrackEventResponse } from '../contracts/RecommendationIPCContracts'
import { toSafeError } from '../errors/IPCErrors'
import type { TrackRecommendationConsumeUseCase, ConsumeParams } from '../../application/use-cases/TrackRecommendationConsumeUseCase'

export class TrackConsumeHandler {
  constructor(private useCase: TrackRecommendationConsumeUseCase) {}

  async handle(params: ConsumeParams): Promise<TrackEventResponse> {
    try {
      await this.useCase.execute(params)
      return { version: 1, success: true }
    } catch (err) { return { version: 1, success: false, error: toSafeError(err).safeMessage } }
  }
}
