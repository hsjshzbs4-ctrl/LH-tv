// src/plugin-marketplace/permissions/PermissionManager.ts — 权限管理器
// P5.1 Plugin Marketplace Core
import { PluginPermission, type PermissionCheckResult } from './types'

type Subscriber = () => void

export class PermissionManager {
  private grants = new Map<string, Set<PluginPermission>>()
  private subscribers = new Set<Subscriber>()

  /** 授予插件权限 */
  grant(pluginId: string, permission: PluginPermission): void {
    if (!this.grants.has(pluginId)) this.grants.set(pluginId, new Set())
    this.grants.get(pluginId)!.add(permission)
    this._notify()
  }

  /** 撤销插件权限 */
  revoke(pluginId: string, permission: PluginPermission): void {
    this.grants.get(pluginId)?.delete(permission)
    this._notify()
  }

  /** 检查插件是否拥有某项权限 */
  check(pluginId: string, permission: PluginPermission): boolean {
    return this.grants.get(pluginId)?.has(permission) || false
  }

  /** 批量检查权限 */
  checkAll(pluginId: string, permissions: PluginPermission[]): PermissionCheckResult {
    const denied = permissions.filter(p => !this.check(pluginId, p))
    return { granted: denied.length === 0, denied, reason: denied.length > 0 ? `Missing: ${denied.join(', ')}` : undefined }
  }

  /** 获取插件的所有权限 */
  getPermissions(pluginId: string): PluginPermission[] {
    return Array.from(this.grants.get(pluginId) || [])
  }

  /** 清空插件权限 */
  revokeAll(pluginId: string): void {
    this.grants.delete(pluginId)
    this._notify()
  }

  subscribe(cb: Subscriber): () => void {
    this.subscribers.add(cb)
    return () => { this.subscribers.delete(cb) }
  }

  private _notify(): void {
    this.subscribers.forEach(fn => { try { fn() } catch { /* */ } })
  }
}

export const permissionManager = new PermissionManager()
