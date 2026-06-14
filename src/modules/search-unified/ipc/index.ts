// modules/search-unified/ipc/index.ts — CE8-D IPC barrel export

export { SEARCH_IPC_CHANNELS } from './channels/SearchIPCChannels'
export type { SearchIPCChannelName } from './channels/SearchIPCChannels'

export { SearchIPCController } from './controller/SearchIPCController'
export { SearchIPCClient } from './client/SearchIPCClient'
export { SearchIPCRegistration } from './registration/SearchIPCRegistration'
export { SearchIPCSchemaValidator } from './validation/SearchIPCSchemaValidator'
export { SearchIPCRequestMapper } from './mappers/SearchIPCRequestMapper'
export { SearchIPCResponseMapper } from './mappers/SearchIPCResponseMapper'
export { SearchIPCErrorMapper } from './mappers/SearchIPCErrorMapper'
export { SearchIPCHealthEndpoint } from './health/SearchIPCHealthEndpoint'

export { IPC_CONTRACT_VERSION } from './contracts/SearchIPCContracts'
export type {
  SearchIPCRequest, SearchIPCResponse, SearchIPCItem,
  SuggestionIPCRequest, SuggestionIPCResponse,
  ClickIPCRequest, PlayIPCRequest,
  HistoryIPCRequest, HistoryIPCResponse,
  TrendingIPCRequest, TrendingIPCResponse,
  ProfileIPCRequest, ProfileIPCResponse,
  HealthIPCResponse, SearchIPCError,
} from './contracts/SearchIPCContracts'
export type { IPCTransport } from './client/SearchIPCClient'
export type { IPCRegistry } from './registration/SearchIPCRegistration'
export type { ValidationResult } from './validation/SearchIPCSchemaValidator'
