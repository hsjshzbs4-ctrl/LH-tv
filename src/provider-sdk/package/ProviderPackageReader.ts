// src/provider-sdk/package/ProviderPackageReader.ts — 插件包读取器
// P5.0: .lhtv-plugin 格式读取
//
// 职责：读取并验证 .lhtv-plugin 包格式
// 暂不实现完整 Marketplace 集成

import type { ProviderManifest, ProviderModule } from '@provider-contracts'

/** 包读取结果 */
export interface PackageReadResult {
  manifest: ProviderManifest
  valid: boolean
  errors: string[]
}

/**
 * ProviderPackageReader — 读取 .lhtv-plugin 包
 *
 * 格式规范:
 *   .lhtv-plugin = ZIP archive containing:
 *     ├── manifest.json     (ProviderManifest as JSON)
 *     ├── main.js           (plugin entry)
 *     └── assets/           (static resources)
 *
 * 暂未实现完整读取逻辑（留待 P5.1 Plugin Marketplace）
 */
export class ProviderPackageReader {
  /** 读取包元数据（桩实现） */
  async readMetadata(_packagePath: string): Promise<PackageReadResult> {
    throw new Error('ProviderPackageReader.readMetadata() — P5.1 Plugin Marketplace complete implementation')
  }

  /** 验证包格式（桩实现） */
  async validate(_packagePath: string): Promise<boolean> {
    throw new Error('ProviderPackageReader.validate() — P5.1 Plugin Marketplace complete implementation')
  }

  /** 从包提取 Provider 模块（桩实现） */
  async extract(_packagePath: string): Promise<ProviderModule> {
    throw new Error('ProviderPackageReader.extract() — P5.1 Plugin Marketplace complete implementation')
  }
}
