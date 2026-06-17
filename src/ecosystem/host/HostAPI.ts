// src/ecosystem/host/HostAPI.ts — 唯一扩展访问入口
// PB7-S3: Extension 只能通过 HostAPI 访问 Storage / UI / Network / Command / Notification
// 禁止 Extension → Core Module 直接访问

import { permissionManager } from '../permission/PermissionManager'
import { sandboxManager } from '../runtime/SandboxManager'
import { storageService } from '@/shared/storage/storage.service'

/** Host API 调用请求 */
export interface HostAPIRequest {
  /** 调用方扩展 ID */
  extensionId: string
  /** API 模块 */
  api: 'storage' | 'ui' | 'network' | 'commands' | 'notifications'
  /** 方法 */
  method: string
  /** 参数 */
  params: Record<string, unknown>
}

/** Host API 调用响应 */
export interface HostAPIResponse {
  success: boolean
  data?: unknown
  error?: string
  /** 审计 ID */
  auditId: string
}

export class HostAPI {
  /**
   * 处理扩展的 Host API 调用
   * 强制检查链: Sandbox check → Permission check → Execute
   */
  async handle(request: HostAPIRequest): Promise<HostAPIResponse> {
    const auditId = `host_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`

    // 1. 沙箱检查 — 确认此 API 在扩展的沙箱白名单中
    const sandboxCheck = sandboxManager.checkAPIAccess(request.extensionId, request.api)
    if (!sandboxCheck.allowed) {
      return { success: false, error: `Sandbox denied: ${sandboxCheck.reason}`, auditId }
    }

    // 2. 权限检查 — 确认扩展已授权此 API 所需权限
    const permissionId = this.apiToPermission(request.api, request.method)
    if (permissionId) {
      const permCheck = permissionManager.check(request.extensionId, permissionId)
      if (!permCheck.allowed) {
        return { success: false, error: `Permission denied: ${permCheck.reason}`, auditId }
      }
    }

    // 3. 执行
    try {
      const data = await this.execute(request)
      return { success: true, data, auditId }
    } catch (err) {
      return { success: false, error: String(err), auditId }
    }
  }

  // ── API 映射 ──

  private apiToPermission(api: string, method: string): string | null {
    const map: Record<string, string> = {
      'storage.get': 'storage.read',
      'storage.set': 'storage.write',
      'storage.delete': 'storage.write',
      'ui.render': 'ui.render',
      'ui.overlay': 'ui.overlay',
      'network.fetch': 'network.fetch',
      'network.websocket': 'network.websocket',
      'commands.register': 'command.execute',
      'commands.invoke': 'command.execute',
      'notifications.send': 'notification.send',
    }
    return map[`${api}.${method}`] ?? null
  }

  private async execute(request: HostAPIRequest): Promise<unknown> {
    switch (request.api) {
      case 'storage':
        return this.handleStorage(request)
      case 'ui':
        return this.handleUI(request)
      case 'network':
        return this.handleNetwork(request)
      case 'commands':
        return this.handleCommands(request)
      case 'notifications':
        return this.handleNotifications(request)
      default:
        throw new Error(`Unknown API: ${request.api}`)
    }
  }

  // ── Storage API ──

  private async handleStorage(request: HostAPIRequest): Promise<unknown> {
    const key = `pb7_ext_${request.extensionId}_${request.params.key as string}`

    switch (request.method) {
      case 'get': {
        const settings = await storageService.getSettings()
        const raw = settings[key]
        return raw && typeof raw === 'string' ? JSON.parse(raw) : null
      }
      case 'set': {
        await storageService.setSettings({ [key]: JSON.stringify(request.params.value) })
        return undefined
      }
      case 'delete': {
        await storageService.setSettings({ [key]: null })
        return undefined
      }
      default:
        throw new Error(`Unknown storage method: ${request.method}`)
    }
  }

  // ── UI / Network / Commands / Notifications (stub — Phase 8 Bootstrap) ──

  private async handleUI(request: HostAPIRequest): Promise<unknown> {
    // PB7-S3: UI API 将通过 Electron IPC 实现，此处提供接口定义
    return { message: 'HostAPI.ui: Integration pending (PB8 UI Bootstrap)' }
  }

  private async handleNetwork(request: HostAPIRequest): Promise<unknown> {
    // PB7-S3: Network 通过 Host 代理，禁止扩展直接访问网络
    return { message: 'HostAPI.network: Integration pending (PB8 Network Bootstrap)' }
  }

  private async handleCommands(request: HostAPIRequest): Promise<unknown> {
    return { message: 'HostAPI.commands: Integration pending (PB8 Command System)' }
  }

  private async handleNotifications(request: HostAPIRequest): Promise<unknown> {
    return { message: 'HostAPI.notifications: Integration pending (PB8 Notification System)' }
  }
}

export const hostAPI = new HostAPI()
