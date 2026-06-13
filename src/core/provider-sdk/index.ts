// src/core/provider-sdk/index.ts - P4.3 Provider SDK
// Provider 插件系统：动态加载、清单管理、接口校验、热重载

export { ProviderSDKFacade, providerSDK } from './facade/ProviderSDKFacade'
export { ProviderLoader } from './loader/ProviderLoader'
export { ManifestParser } from './manifest/ManifestParser'
export { ProviderValidator } from './validator/ProviderValidator'
export { ProviderState } from './types/provider-sdk.types'
export type {
  ProviderManifest,
  InstalledProvider,
  ProviderModule,
  ProviderLoaderConfig,
  LoadResult,
} from './types/provider-sdk.types'
