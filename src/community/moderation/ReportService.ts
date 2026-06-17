// src/community/moderation/ReportService.ts — 用户举报服务
// PB7-S4: 举报提交、查询、处理

import { featureFlagManager } from '@platform/flags'
import { communityRegistry } from '../registry'
import type { Report, ReportStatus } from '../contracts'

export class ReportService {
  /**
   * 提交举报
   */
  fileReport(
    report: Omit<Report, 'id' | 'createdAt' | 'status'>,
  ): { success: boolean; report?: Report; error?: string } {
    this.ensureEnabled()
    return communityRegistry.fileReport(report)
  }

  /**
   * 查询举报
   */
  getReports(filter?: { status?: ReportStatus; itemId?: string }): Report[] {
    return communityRegistry.getReports(filter)
  }

  /**
   * 处理举报
   */
  resolveReport(reportId: string, resolution: 'resolved' | 'dismissed'): boolean {
    this.ensureEnabled()
    return communityRegistry.resolveReport(reportId, resolution)
  }

  /**
   * 举报统计
   */
  getReportStats(): { pending: number; reviewed: number; resolved: number; dismissed: number } {
    const all = communityRegistry.getReports()
    return {
      pending: all.filter((r) => r.status === 'pending').length,
      reviewed: all.filter((r) => r.status === 'reviewed').length,
      resolved: all.filter((r) => r.status === 'resolved').length,
      dismissed: all.filter((r) => r.status === 'dismissed').length,
    }
  }

  private ensureEnabled(): void {
    if (!featureFlagManager.isEnabled('pb7.community')) {
      throw new Error('Community Platform is not enabled. Enable pb7.community feature flag.')
    }
  }
}

export const reportService = new ReportService()
