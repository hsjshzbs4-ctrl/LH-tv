// src/platform/plugins/adapters/ProviderPluginAdapter.ts — Provider 插件适配器
// Adapter Pattern: 包装现有 ProviderRegistry 插件，不改已有代码

import { PluginType, PluginState, type PluginManifest, type PluginCapability } from '../types/plugin.types'

/**
 * 将现有的 Provider Manifest 转换为统一 PluginManifest
 * 对应 src/provider-contracts/types/manifest.types.ts 中的 ProviderManifest
 */
export function adaptProviderToPlugin(
  providerId: string,
  providerName: string,
  providerVersion: string,
  providerDescription: string,
  providerAuthor: string,
  capabilities?: string[],
): PluginManifest {
  return {
    id: `provider:${providerId}`,
    name: providerName,
    version: providerVersion,
    type: PluginType.METADATA_PROVIDER,
    description: providerDescription,
    author: providerAuthor,
    permissions: ['provider_access', 'network_access'],
    dependencies: [],
    state: PluginState.ENABLED,
    installedAt: Date.now(),
    updatedAt: Date.now(),
    metadata: {
      providerId,
      source: 'provider-sdk',
      capabilities: capabilities ?? [],
    },
  }
}

/**
 * 将已有 IRecommendationProvider 包装为插件
 */
export function adaptRecommendationProviderToPlugin(
  providerId: string,
  providerName: string,
  providerVersion: string,
): PluginManifest {
  return {
    id: `recommendation:${providerId}`,
    name: providerName,
    version: providerVersion,
    type: PluginType.RECOMMENDATION_PROVIDER,
    description: `Recommendation provider: ${providerName}`,
    author: 'system',
    permissions: ['recommendation_access'],
    dependencies: [],
    state: PluginState.ENABLED,
    installedAt: Date.now(),
    updatedAt: Date.now(),
    metadata: {
      providerId,
      source: 'ce9-recommendation',
    },
  }
}

export function getProviderCapabilities(): PluginCapability[] {
  return [
    { type: 'metadata-search', version: '1.0', description: 'Search metadata across providers' },
    { type: 'episode-list', version: '1.0', description: 'Fetch episode list' },
    { type: 'media-detail', version: '1.0', description: 'Fetch media detail' },
  ]
}
