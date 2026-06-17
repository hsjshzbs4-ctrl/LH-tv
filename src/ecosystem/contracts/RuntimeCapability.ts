// src/ecosystem/contracts/RuntimeCapability.ts — 运行时能力定义
// PB7-S3: 扩展通过 Manifest 声明所需能力，Runtime 进行校验和授予

/** 运行时能力定义 */
export interface RuntimeCapability {
  /** 能力唯一 ID */
  capabilityId: string
  /** 能力名称 */
  name: string
  /** 能力描述 */
  description: string
}

/** 能力校验结果 */
export interface CapabilityCheckResult {
  /** 是否支持 */
  supported: boolean
  /** 不支持的 reason (if !supported) */
  reason?: string
  /** 所需运行时最低版本 */
  requiredRuntimeVersion?: string
}

/** 内置运行时能力 (PB7-S3 Foundation) */
export const BUILTIN_CAPABILITIES: RuntimeCapability[] = [
  {
    capabilityId: 'host.storage',
    name: 'Host Storage',
    description: 'Access to extension-scoped key-value storage via Host API',
  },
  {
    capabilityId: 'host.ui',
    name: 'Host UI',
    description: 'Access to host UI rendering slots and component registration',
  },
  {
    capabilityId: 'host.network',
    name: 'Host Network',
    description: 'Access to proxied network requests via Host API',
  },
  {
    capabilityId: 'host.commands',
    name: 'Host Commands',
    description: 'Register and invoke commands through the host command system',
  },
  {
    capabilityId: 'host.notifications',
    name: 'Host Notifications',
    description: 'Send desktop and in-app notifications via Host API',
  },
  {
    capabilityId: 'host.media',
    name: 'Host Media',
    description: 'Access to media library metadata and playback state',
  },
  {
    capabilityId: 'host.worker',
    name: 'Host Worker',
    description: 'Spawn background worker threads for CPU-intensive tasks',
  },
  {
    capabilityId: 'host.ai',
    name: 'Host AI',
    description: 'Access to AI orchestration (ModelGateway, ContextEngine, Tools)',
  },
]
