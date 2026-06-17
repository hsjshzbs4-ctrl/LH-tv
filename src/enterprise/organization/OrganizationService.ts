// src/enterprise/organization/OrganizationService.ts — 组织管理服务
// PB7-S5: Tenant/Department/Team 管理, 通过 OrganizationRegistry (SSOT)

import { featureFlagManager } from '@platform/flags'
import { organizationRegistry } from './OrganizationRegistry'

export class OrganizationService {
  /** 创建租户 */
  createTenant(name: string) {
    this.ensureEnabled()
    return organizationRegistry.createTenant(name)
  }

  /** 获取租户列表 */
  listTenants() {
    return organizationRegistry.listTenants()
  }

  /** 创建部门 */
  createDepartment(tenantId: string, name: string, parentId?: string) {
    this.ensureEnabled()
    return organizationRegistry.createDepartment(tenantId, name, parentId)
  }

  /** 列出部门的成员 */
  getMembers(tenantId: string) {
    return organizationRegistry.getMembers(tenantId)
  }

  /** 导出组织数据 */
  export() {
    return organizationRegistry.export()
  }

  /** 删除租户 */
  clearTenant(tenantId: string) {
    this.ensureEnabled()
    return organizationRegistry.clearTenant(tenantId)
  }

  private ensureEnabled(): void {
    if (!featureFlagManager.isEnabled('pb7.enterprise')) {
      throw new Error('Enterprise Integration is not enabled. Enable pb7.enterprise feature flag.')
    }
  }
}

export const organizationService = new OrganizationService()
