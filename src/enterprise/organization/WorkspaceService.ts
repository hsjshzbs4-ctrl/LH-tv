// src/enterprise/organization/WorkspaceService.ts — 工作空间管理
// PB7-S5: Workspace 隔离 (Tenant → Department → Workspace)
// 审查要求: 禁止跨 Tenant 可见, 任何 Query 先验证 tenantId

import { featureFlagManager } from '@platform/flags'
import { organizationRegistry } from './OrganizationRegistry'

export class WorkspaceService {
  /** 创建工作空间 */
  create(tenantId: string, departmentId: string, name: string) {
    this.ensureEnabled()
    return organizationRegistry.createWorkspace(tenantId, departmentId, name)
  }

  /** 获取工作空间 — 验证 tenantId */
  get(workspaceId: string, tenantId: string) {
    const ws = organizationRegistry.getWorkspace(workspaceId)
    if (!ws) return null
    // 跨租户访问检查
    if (ws.tenantId !== tenantId) return null
    return ws
  }

  /** 列出租户下所有工作空间 */
  listByTenant(tenantId: string) {
    return organizationRegistry.listWorkspaces(tenantId)
  }

  /** 添加成员 */
  addMember(workspaceId: string, userId: string) {
    this.ensureEnabled()
    return organizationRegistry.addWorkspaceMember(workspaceId, userId)
  }

  /** 移除成员 */
  removeMember(workspaceId: string, userId: string) {
    this.ensureEnabled()
    return organizationRegistry.removeWorkspaceMember(workspaceId, userId)
  }

  private ensureEnabled(): void {
    if (!featureFlagManager.isEnabled('pb7.enterprise')) {
      throw new Error('Enterprise Integration is not enabled. Enable pb7.enterprise feature flag.')
    }
  }
}

export const workspaceService = new WorkspaceService()
