// src/ecosystem/permission/CapabilityChecker.ts — 能力校验器
// PB7-S3: 验证扩展声明的能力是否被运行时支持

import {
  type RuntimeCapability,
  type CapabilityCheckResult,
  BUILTIN_CAPABILITIES,
} from '../contracts/RuntimeCapability'

export class CapabilityChecker {
  private capabilities = new Map<string, RuntimeCapability>()

  constructor() {
    for (const cap of BUILTIN_CAPABILITIES) {
      this.capabilities.set(cap.capabilityId, cap)
    }
  }

  /** 注册新能力 */
  registerCapability(capability: RuntimeCapability): void {
    if (this.capabilities.has(capability.capabilityId)) {
      throw new Error(`Capability "${capability.capabilityId}" already registered`)
    }
    this.capabilities.set(capability.capabilityId, capability)
  }

  /** 检查运行时是否支持某项能力 */
  check(capabilityId: string, runtimeVersion: string): CapabilityCheckResult {
    const capability = this.capabilities.get(capabilityId)
    if (!capability) {
      return {
        supported: false,
        reason: `Capability "${capabilityId}" is not supported by this runtime`,
      }
    }
    return { supported: true }
  }

  /** 批量检查能力 */
  checkAll(
    capabilityIds: string[],
    runtimeVersion: string,
  ): { supported: string[]; unsupported: string[] } {
    const supported: string[] = []
    const unsupported: string[] = []

    for (const id of capabilityIds) {
      if (this.check(id, runtimeVersion).supported) {
        supported.push(id)
      } else {
        unsupported.push(id)
      }
    }

    return { supported, unsupported }
  }

  /** 列出所有支持的能力 */
  listCapabilities(): RuntimeCapability[] {
    return Array.from(this.capabilities.values())
  }
}

export const capabilityChecker = new CapabilityChecker()
