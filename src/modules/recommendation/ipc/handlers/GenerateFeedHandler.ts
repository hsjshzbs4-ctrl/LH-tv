// modules/recommendation/ipc/handlers/GenerateFeedHandler.ts — CE9-E

import type { GenerateFeedRequest, GenerateFeedResponse } from '../contracts/RecommendationIPCContracts'
import { validateGenerateFeedRequest } from '../validators/IPCValidators'
import { mapRequestToDto, mapResponseToIPC } from '../mappers/IPCMappers'
import { IPCValidationError, toSafeError } from '../errors/IPCErrors'
import type { GenerateRecommendationsUseCase } from '../../application/use-cases/GenerateRecommendationsUseCase'

export class GenerateFeedHandler {
  constructor(private useCase: GenerateRecommendationsUseCase) {}

  async handle(request: GenerateFeedRequest): Promise<GenerateFeedResponse> {
    const errors = validateGenerateFeedRequest(request)
    if (errors.length > 0) throw new IPCValidationError(errors)
    try {
      const dto = mapRequestToDto(request)
      const response = await this.useCase.execute(dto)
      return mapResponseToIPC(response)
    } catch (err) { throw toSafeError(err) }
  }
}
