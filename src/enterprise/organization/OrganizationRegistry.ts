// src/enterprise/organization/OrganizationRegistry.ts — 组织注册中心 (唯一 SSOT)
// PB7-S5: 统一管理 Tenant/Department/Workspace/Member
// 审查要求: 禁止多 Map, export(), clearTenant(), Tenant 隔离

import { featureFlagManager } from '@platform/flags'
import type { Tenant, Department, Workspace, Member, RegistrySnapshot } from '../contracts'

export class OrganizationRegistry {
  private tenants = new Map<string, Tenant>()
  private departments = new Map<string, Department>()
  private workspaces = new Map<string, Workspace>()
  private members = new Map<string, Member[]>()
  private idCounter = 0

  // ── Tenant ──

  createTenant(name: string): { success: boolean; tenant?: Tenant; error?: string } {
    this.ensureEnabled()
    const id = `tenant_${Date.now().toString(36)}_${++this.idCounter}`
    const tenant: Tenant = { id, name, createdAt: Date.now(), updatedAt: Date.now() }
    this.tenants.set(id, tenant)
    return { success: true, tenant }
  }

  getTenant(id: string): Tenant | null {
    return this.tenants.get(id) ?? null
  }

  listTenants(): Tenant[] {
    return Array.from(this.tenants.values())
  }

  removeTenant(id: string): boolean {
    this.ensureEnabled()
    return this.tenants.delete(id)
  }

  // ── Department ──

  createDepartment(tenantId: string, name: string, parentId?: string): { success: boolean; department?: Department; error?: string } {
    this.ensureEnabled()
    if (!this.tenants.has(tenantId)) {
      return { success: false, error: `Tenant "${tenantId}" not found` }
    }
    const id = `dept_${Date.now().toString(36)}_${++this.idCounter}`
    const dept: Department = { id, tenantId, name, parentId, createdAt: Date.now(), updatedAt: Date.now() }
    this.departments.set(id, dept)
    return { success: true, department: dept }
  }

  getDepartment(id: string): Department | null {
    return this.departments.get(id) ?? null
  }

  listDepartments(tenantId: string): Department[] {
    return Array.from(this.departments.values()).filter((d) => d.tenantId === tenantId)
  }

  // ── Workspace (强制 Tenant 隔离) ──

  createWorkspace(
    tenantId: string,
    departmentId: string,
    name: string,
  ): { success: boolean; workspace?: Workspace; error?: string } {
    this.ensureEnabled()
    if (!this.tenants.has(tenantId)) {
      return { success: false, error: `Tenant "${tenantId}" not found` }
    }
    if (!this.departments.has(departmentId)) {
      return { success: false, error: `Department "${departmentId}" not found` }
    }
    const dept = this.departments.get(departmentId)!
    if (dept.tenantId !== tenantId) {
      return { success: false, error: `Department "${departmentId}" does not belong to tenant "${tenantId}"` }
    }

    const id = `ws_${Date.now().toString(36)}_${++this.idCounter}`
    const ws: Workspace = { id, tenantId, departmentId, name, memberIds: [], createdAt: Date.now(), updatedAt: Date.now() }
    this.workspaces.set(id, ws)
    return { success: true, workspace: ws }
  }

  getWorkspace(id: string): Workspace | null {
    return this.workspaces.get(id) ?? null
  }

  /** 列出工作空间 — 必须验证 tenantId */
  listWorkspaces(tenantId: string): Workspace[] {
    return Array.from(this.workspaces.values()).filter((w) => w.tenantId === tenantId)
  }

  addWorkspaceMember(workspaceId: string, userId: string): boolean {
    const ws = this.workspaces.get(workspaceId)
    if (!ws) return false
    if (!ws.memberIds.includes(userId)) {
      ws.memberIds.push(userId)
      ws.updatedAt = Date.now()
    }
    return true
  }

  removeWorkspaceMember(workspaceId: string, userId: string): boolean {
    const ws = this.workspaces.get(workspaceId)
    if (!ws) return false
    const idx = ws.memberIds.indexOf(userId)
    if (idx === -1) return false
    ws.memberIds.splice(idx, 1)
    ws.updatedAt = Date.now()
    return true
  }

  // ── Member ──

  addMember(member: Member): boolean {
    this.ensureEnabled()
    if (!this.tenants.has(member.tenantId)) return false
    let list = this.members.get(member.tenantId)
    if (!list) {
      list = []
      this.members.set(member.tenantId, list)
    }
    const existing = list.findIndex((m) => m.userId === member.userId)
    if (existing >= 0) {
      list[existing] = member
    } else {
      list.push(member)
    }
    return true
  }

  getMembers(tenantId: string): Member[] {
    return this.members.get(tenantId) ?? []
  }

  // ── export / clearTenant (审查要求) ──

  /** 导出所有组织数据 */
  export(): { tenants: Tenant[]; departments: Department[]; workspaces: Workspace[]; members: Member[] } {
    return {
      tenants: this.listTenants(),
      departments: Array.from(this.departments.values()),
      workspaces: Array.from(this.workspaces.values()),
      members: Array.from(this.members.values()).flat(),
    }
  }

  // ── Snapshot / Restore / Checksum (PB7-S5.1) ──

  /** 创建不可变快照 */
  snapshot(): RegistrySnapshot<ReturnType<typeof this.export>> {
    const data = this.export()
    const timestamp = Date.now()
    return {
      registry: 'OrganizationRegistry',
      version: 1,
      timestamp,
      checksum: this.computeChecksum(JSON.stringify(data)),
      data,
    }
  }

  /** 从快照恢复 */
  restore(snapshot: RegistrySnapshot<ReturnType<typeof this.export>>): { success: boolean; error?: string } {
    this.ensureEnabled()
    if (snapshot.registry !== 'OrganizationRegistry') {
      return { success: false, error: 'Snapshot registry mismatch' }
    }
    const expectedChecksum = this.computeChecksum(JSON.stringify(snapshot.data))
    if (snapshot.checksum !== expectedChecksum) {
      return { success: false, error: 'Snapshot checksum mismatch — data may be corrupted' }
    }
    // 清空并恢复
    this.tenants.clear()
    this.departments.clear()
    this.workspaces.clear()
    this.members.clear()
    for (const t of snapshot.data.tenants) this.tenants.set(t.id, t)
    for (const d of snapshot.data.departments) this.departments.set(d.id, d)
    for (const w of snapshot.data.workspaces) this.workspaces.set(w.id, w)
    for (const m of snapshot.data.members) {
      let list = this.members.get(m.tenantId)
      if (!list) { list = []; this.members.set(m.tenantId, list) }
      list.push(m)
    }
    return { success: true }
  }

  /** 计算当前状态校验和 */
  checksum(): string {
    return this.computeChecksum(JSON.stringify(this.export()))
  }

  private computeChecksum(data: string): string {
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash + char) | 0
    }
    return (hash >>> 0).toString(16).padStart(8, '0')
  }

  /** 清除租户所有数据 (GDPR / 租户删除) */
  clearTenant(tenantId: string): { removed: number } {
    this.ensureEnabled()
    let removed = 0
    this.tenants.delete(tenantId) && removed++

    for (const [id, dept] of this.departments) {
      if (dept.tenantId === tenantId) { this.departments.delete(id); removed++ }
    }
    for (const [id, ws] of this.workspaces) {
      if (ws.tenantId === tenantId) { this.workspaces.delete(id); removed++ }
    }
    this.members.delete(tenantId) && removed++

    return { removed }
  }

  private ensureEnabled(): void {
    if (!featureFlagManager.isEnabled('pb7.enterprise')) {
      throw new Error('Enterprise Integration is not enabled. Enable pb7.enterprise feature flag.')
    }
  }
}

export const organizationRegistry = new OrganizationRegistry()
