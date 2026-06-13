// plugins/apple-cms/index.ts - AppleCMS Provider 插件入口
// P4.3 Provider SDK

import type { ProviderManifest, ProviderModule } from '@provider-contracts'
import { AppleCMSProvider } from '@/core/providers/providers/AppleCMSProvider'
import manifest from './provider.json'

const typedManifest = manifest as ProviderManifest

const plugin: ProviderModule = {
  manifest: typedManifest,
  createProvider: () => new AppleCMSProvider(),
}

export default plugin
export { typedManifest as manifest }
