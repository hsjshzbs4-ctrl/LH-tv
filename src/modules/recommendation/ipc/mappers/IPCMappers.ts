// modules/recommendation/ipc/mappers/IPCMappers.ts — CE9-E

import type { RecommendationRequestDto } from '../../application/dto/RecommendationRequestDto'
import type { RecommendationResponseDto } from '../../application/dto/RecommendationResponseDto'
import type { GenerateFeedRequest, GenerateFeedResponse } from '../contracts/RecommendationIPCContracts'

export function mapRequestToDto(req: GenerateFeedRequest): RecommendationRequestDto {
  return {
    requestId: req.requestId,
    userId: req.userId,
    experimentId: req.experimentId,
    variantId: req.variantId,
    timestamp: Date.now(),
    feedType: req.feedType,
    limit: req.limit,
    offset: req.offset,
    metadata: req.sourceMediaId ? { sourceMediaId: req.sourceMediaId } : undefined,
  }
}

export function mapResponseToIPC(dto: RecommendationResponseDto, version = 1): GenerateFeedResponse {
  return {
    version,
    requestId: dto.requestId,
    feed: dto.feed,
    generatedAt: dto.generatedAt,
    duration: dto.duration,
    cacheHit: dto.cacheHit,
  }
}
