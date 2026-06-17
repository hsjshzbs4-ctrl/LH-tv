// src/community/template/TemplateRepository.ts — 模板仓库
// PB7-S4: 社区模板发布、查询、安装
// 发布需要 CONFIRM，安装通过 HostAPI (SAFE)

import { featureFlagManager } from '@platform/flags'
import { communityRegistry } from '../registry'
import { CommunityAction, CommunityPolicy } from '../governance'
import { type CommunityItem, type TemplateConfig, type FeedQuery } from '../contracts'

/** 带模板配置的社区条目 */
export interface TemplateEntry {
  item: CommunityItem
  config: TemplateConfig
}

export class TemplateRepository {
  private templateConfigs = new Map<string, TemplateConfig>()

  /**
   * 发布模板
   * 需要认证级别 COMMUNITY+ (CONFIRM)
   */
  publish(
    template: Omit<CommunityItem, 'id' | 'createdAt' | 'updatedAt' | 'averageRating' | 'ratingCount' | 'commentCount' | 'downloads'>,
    config: TemplateConfig,
  ): { success: boolean; item?: CommunityItem; error?: string } {
    this.ensureEnabled()

    // 模板发布需要社区权限 CONFIRM
    const publishCheck = CommunityPolicy.validate(
      template.certificationLevel ?? 'uncertified',
      CommunityAction.PUBLISH_TEMPLATE,
    )
    if (!publishCheck.allowed) {
      return { success: false, error: publishCheck.reason }
    }

    // 模板配置校验
    if (!config.slots || !Array.isArray(config.slots)) {
      return { success: false, error: 'Template config must include slots array' }
    }

    // 注册到 CommunityRegistry (SSOT)
    const result = communityRegistry.register(template)
    if (!result.success || !result.item) {
      return result
    }

    // 保存模板配置
    this.templateConfigs.set(result.item.id, config)

    return { success: true, item: result.item }
  }

  /**
   * 获取模板 (条目 + 配置)
   */
  getTemplate(id: string): TemplateEntry | null {
    const item = communityRegistry.get(id)
    if (!item || item.type !== 'template') return null

    const config = this.templateConfigs.get(id)
    if (!config) return null

    return { item, config }
  }

  /**
   * 列出所有模板
   */
  listTemplates(query?: Partial<FeedQuery>): CommunityItem[] {
    return communityRegistry.search({ ...query, type: 'template' })
  }

  /**
   * 安装模板
   * 通过 HostAPI 应用模板配置 (SAFE 操作)
   */
  installTemplate(id: string): { success: boolean; error?: string } {
    this.ensureEnabled()

    const entry = this.getTemplate(id)
    if (!entry) {
      return { success: false, error: `Template "${id}" not found` }
    }

    // 记录下载
    communityRegistry.recordDownload(id)

    // PB7-S4: 模板安装通过 HostAPI 实施
    // 当前返回配置供 HostAPI 消费
    return { success: true }
  }

  /**
   * 获取模板配置 (供 HostAPI 消费)
   */
  getTemplateConfig(id: string): TemplateConfig | null {
    return this.templateConfigs.get(id) ?? null
  }

  private ensureEnabled(): void {
    if (!featureFlagManager.isEnabled('pb7.community')) {
      throw new Error('Community Platform is not enabled. Enable pb7.community feature flag.')
    }
  }
}

export const templateRepository = new TemplateRepository()
