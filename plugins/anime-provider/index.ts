// plugins/anime-provider/index.ts - AnimeProvider 插件入口
// P4.3 Provider SDK

import type { ProviderManifest, ProviderModule } from '@provider-contracts'
import { AnimeCrawlerProvider } from '@/core/providers/providers/AnimeCrawlerProvider'
import manifest from './provider.json'

const typedManifest = manifest as ProviderManifest

const plugin: ProviderModule = {
  manifest: typedManifest,
  createProvider: () => new AnimeCrawlerProvider(),
}

export default plugin
export { typedManifest as manifest }
