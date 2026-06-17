// src/community/sharing/ShareService.ts — 分享服务
// PB7-S4: 生成分享链接、复制到剪贴板
// 所有操作均为 SAFE 级别，无需用户确认

import { featureFlagManager } from '@platform/flags'
import { communityRegistry } from '../registry'
import { CommunityAction, CommunityPolicy } from '../governance'
import type { ShareTarget } from '../contracts'

export class ShareService {
  /**
   * 分享社区条目
   */
  share(itemId: string, target: ShareTarget): { success: boolean; url?: string; error?: string } {
    this.ensureEnabled()

    // 验证条目存在
    const item = communityRegistry.get(itemId)
    if (!item) {
      return { success: false, error: `Community item "${itemId}" not found` }
    }

    // 权限检查 (SAFE)
    if (!CommunityPolicy.canShare(item.certificationLevel)) {
      return { success: false, error: 'Sharing not allowed for this certification level' }
    }

    switch (target.platform) {
      case 'clipboard':
        return this.copyToClipboard(itemId)
      case 'url':
      case 'social':
        return { success: true, url: this.generateShareURL(itemId) }
      default:
        return { success: false, error: `Unsupported platform: ${target.platform}` }
    }
  }

  /**
   * 生成分享 URL
   */
  generateShareURL(itemId: string): string {
    return `lh-tv://community/${itemId}`
  }

  /**
   * 复制到剪贴板
   */
  private copyToClipboard(itemId: string): { success: boolean; url?: string; error?: string } {
    const url = this.generateShareURL(itemId)
    try {
      // 浏览器/Electron 环境剪贴板 API
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url).catch(() => {
          // 静默失败 — 返回 URL 作为降级
        })
      }
      return { success: true, url }
    } catch {
      return { success: true, url }
    }
  }

  private ensureEnabled(): void {
    if (!featureFlagManager.isEnabled('pb7.community')) {
      throw new Error('Community Platform is not enabled. Enable pb7.community feature flag.')
    }
  }
}

export const shareService = new ShareService()
