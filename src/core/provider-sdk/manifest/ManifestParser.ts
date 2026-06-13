// src/core/provider-sdk/manifest/ManifestParser.ts - 清单解析器
// P4.3 Provider SDK
//
// 职责：解析 provider.json → ProviderManifest
// 禁止：Provider 加载、UI

import type { ProviderManifest } from '../types/provider-sdk.types'

/** 必填字段 */
const REQUIRED_FIELDS: (keyof ProviderManifest)[] = [
  'id', 'name', 'version', 'entry',
]

export class ManifestParser {
  /** 解析原始 JSON 数据为 ProviderManifest */
  parse(raw: unknown): ProviderManifest | null {
    if (!raw || typeof raw !== 'object') return null

    const data = raw as Record<string, unknown>

    // 检查必填字段
    for (const field of REQUIRED_FIELDS) {
      if (!data[field] || typeof data[field] !== 'string') {
        return null
      }
    }

    return {
      id: data.id as string,
      name: data.name as string,
      version: data.version as string,
      author: (data.author as string) || 'Unknown',
      description: (data.description as string) || '',
      homepage: data.homepage as string | undefined,
      priority: typeof data.priority === 'number' ? data.priority : 100,
      entry: data.entry as string,
    }
  }

  /** 验证 manifest 是否完整 */
  validate(manifest: ProviderManifest): string[] {
    const errors: string[] = []

    if (!manifest.id || !/^[a-z0-9-]+$/.test(manifest.id)) {
      errors.push(`Invalid id: "${manifest.id}" (must be lowercase alphanumeric with hyphens)`)
    }
    if (!manifest.name) errors.push('name is required')
    if (!manifest.version) errors.push('version is required')
    if (!manifest.entry) errors.push('entry is required')

    // Semver 简单校验
    if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
      errors.push(`Invalid version format: "${manifest.version}" (expected semver)`)
    }

    return errors
  }
}
