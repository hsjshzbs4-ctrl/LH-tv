// modules/recommendation/ipc/index.ts — CE9-E Barrel Export

export { RecommendationIPCChannels } from './channels/RecommendationIPCChannels'
export type { RecommendationIPCChannel } from './channels/RecommendationIPCChannels'
export { IPC_CONTRACT_VERSION } from './contracts/RecommendationIPCContracts'
export type { GenerateFeedRequest, GenerateFeedResponse, TrackEventRequest, TrackEventResponse, HealthResponse, MetricsResponse } from './contracts/RecommendationIPCContracts'

export { GenerateFeedHandler } from './handlers/GenerateFeedHandler'
export { PersonalizedFeedHandler } from './handlers/PersonalizedFeedHandler'
export { TrendingFeedHandler } from './handlers/TrendingFeedHandler'
export { ContinueWatchingHandler } from './handlers/ContinueWatchingHandler'
export { SimilarContentHandler } from './handlers/SimilarContentHandler'
export { TrackClickHandler } from './handlers/TrackClickHandler'
export { TrackConsumeHandler } from './handlers/TrackConsumeHandler'
export { HealthHandler } from './handlers/HealthHandler'
export { MetricsHandler } from './handlers/MetricsHandler'

export { RecommendationIPCError, IPCValidationError, IPCTransportError, IPCTimeoutError, toSafeError } from './errors/IPCErrors'
export { IPCEventTypes } from './events/IPCEvents'
export type { IPCEventType, IPCEvent, FeedGeneratedEvent, FeedRefreshedEvent, RecommendationClickedEvent, RecommendationConsumedEvent, HealthChangedEvent } from './events/IPCEvents'
export { validateGenerateFeedRequest, validateTrackEventRequest } from './validators/IPCValidators'
export { mapRequestToDto, mapResponseToIPC } from './mappers/IPCMappers'
