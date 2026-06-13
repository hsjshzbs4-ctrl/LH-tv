// src/provider-sdk/package/ProviderPackageBuilder.ts — 插件包构建器
// P5.0: .lhtv-plugin 格式打包
//
// 职责：将插件目录打包为 .lhtv-plugin 格式
// 暂不实现 Marketplace 发布，仅完成格式定义

import type { ProviderManifest } from '@provider-contracts'

/** .lhtv-plugin 包内容结构 */
export interface PluginPackage {
  /** 清单文件 */
  manifest: ProviderManifest
  /** 主入口文件内容 */
  main: string
  /** 资源文件映射 */
  assets: Map<string, Buffer>
}

/** 包构建配置 */
export interface PackageBuilderConfig {
  /** 输出目录 */
  outputDir: string
  /** 是否压缩 */
  compress?: boolean
}

/**
 * ProviderPackageBuilder — 构建 .lhtv-plugin 包
 *
 * 格式规范:
 *   .lhtv-plugin = ZIP archive containing:
 *     ├── manifest.json     (ProviderManifest as JSON)
 *     ├── main.js           (plugin entry, compiled from index.ts)
 *     └── assets/           (static resources)
 *
 * 暂未实现完整打包逻辑（留待 P5.1 Plugin Marketplace）
 */
export class ProviderPackageBuilder {
  private config: PackageBuilderConfig

  constructor(config: PackageBuilderConfig) {
    this.config = { compress: true, ...config }
  }

  /** 构建包（桩实现） */
  async build(_manifest: ProviderManifest, _entryModule: unknown): Promise<Buffer> {
    // P5.1 完整实现
    throw new Error('ProviderPackageBuilder.build() — P5.1 Plugin Marketplace complete implementation')
  }

  /** 获取包输出路径 */
  getOutputPath(pluginId: string, version: string): string {
    return `${this.config.outputDir}/${pluginId}-${version}.lhtv-plugin`
  }
}
