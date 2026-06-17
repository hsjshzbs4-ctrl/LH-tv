// src/ecosystem/contracts/ExtensionManifest.ts — 扩展清单 (唯一 SSOT)
// PB7-S3: 所有模块 (Runtime/SDK/Marketplace/Governance/Community/Enterprise) 必须读取此定义
// 禁止: MarketplaceManifest / SDKManifest / RuntimeManifest 等衍生版本

/** 扩展类型 */
export enum ExtensionType {
  /** 插件扩展 — 数据/字幕/分析 Provider */
  PLUGIN = 'plugin',
  /** 主题扩展 — UI 主题/皮肤 */
  THEME = 'theme',
  /** AI Agent 扩展 — AI 能力代理 */
  AI_AGENT = 'ai_agent',
  /** 模板扩展 — 配置/布局模板 */
  TEMPLATE = 'template',
  /** 能力包扩展 — 独立功能模块 */
  CAPABILITY_PACK = 'capability_pack',
}

/** 扩展生命周期状态 */
export enum ExtensionState {
  /** 已注册但未安装 */
  REGISTERED = 'registered',
  /** 已安装但未加载 */
  INSTALLED = 'installed',
  /** 已加载到内存 */
  LOADED = 'loaded',
  /** 正在运行 */
  RUNNING = 'running',
  /** 已停止 */
  STOPPED = 'stopped',
  /** 已卸载 */
  UNINSTALLED = 'uninstalled',
}

/** 权限声明 (清单中声明，运行时由 PermissionManager 校验) */
export interface ManifestPermission {
  /** 权限 ID */
  id: string
  /** 使用原因说明 */
  reason: string
}

/** 能力声明 (清单中声明，运行时由 CapabilityChecker 校验) */
export interface ManifestCapability {
  /** 能力 ID */
  id: string
}

/** 发布者信息 */
export interface PublisherInfo {
  /** 发布者 ID */
  id: string
  /** 发布者名称 */
  name: string
  /** 发布者邮箱 */
  email?: string
  /** 发布者网站 */
  url?: string
}

/** 扩展清单 — PB7 唯一 SSOT */
export interface ExtensionManifest {
  /** 全局唯一标识，格式: <publisher>.<name> e.g. "acme.search-plugin" */
  id: string
  /** 人类可读名称 */
  name: string
  /** 语义化版本 */
  version: string
  /** 发布者信息 */
  publisher: PublisherInfo
  /** 数字签名 (内容哈希) */
  signature: string
  /** 运行时最低版本要求 */
  runtimeVersion: string
  /** 扩展类型 */
  type: ExtensionType
  /** 扩展类型 (用于向后兼容旧 PluginManifest) */
  readonly kind: ExtensionType
  /** 入口文件/模块路径 */
  entry: string
  /** 描述 */
  description: string
  /** 图标 URL */
  icon?: string
  /** 权限声明 */
  permissions: ManifestPermission[]
  /** 能力声明 */
  capabilities: ManifestCapability[]
  /** 依赖的其他扩展 ID */
  dependencies: string[]
  /** 元数据 */
  metadata?: Record<string, unknown>
}

/** 扩展清单校验结果 */
export interface ManifestValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * 清单校验器 — 验证 ExtensionManifest 的完整性和合法性
 * 所有注册入口必须调用此校验
 */
export function validateManifest(manifest: unknown): ManifestValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['Manifest must be a non-null object'], warnings: [] }
  }

  const m = manifest as Record<string, unknown>

  // 必填字段校验
  if (!m.id || typeof m.id !== 'string') errors.push('id is required (string)')
  if (!m.name || typeof m.name !== 'string') errors.push('name is required (string)')
  if (!m.version || typeof m.version !== 'string') errors.push('version is required (string)')
  if (!m.publisher || typeof m.publisher !== 'object') {
    errors.push('publisher is required (object)')
  } else {
    const pub = m.publisher as Record<string, unknown>
    if (!pub.id || typeof pub.id !== 'string') errors.push('publisher.id is required')
    if (!pub.name || typeof pub.name !== 'string') errors.push('publisher.name is required')
  }
  if (!m.signature || typeof m.signature !== 'string') {
    warnings.push('signature is missing — extension will run in unsigned mode')
  }
  if (!m.runtimeVersion || typeof m.runtimeVersion !== 'string') warnings.push('runtimeVersion not specified')
  if (!m.entry || typeof m.entry !== 'string') errors.push('entry is required (string)')
  if (!m.type || typeof m.type !== 'string') {
    errors.push('type is required')
  } else if (!Object.values(ExtensionType).includes(m.type as ExtensionType)) {
    errors.push(`type must be one of: ${Object.values(ExtensionType).join(', ')}`)
  }
  if (!Array.isArray(m.permissions)) {
    errors.push('permissions must be an array')
  }
  if (!Array.isArray(m.capabilities)) {
    errors.push('capabilities must be an array')
  }

  // ID 格式校验
  if (m.id && typeof m.id === 'string' && !/^[a-z0-9_-]+\.[a-z0-9_-]+$/i.test(m.id)) {
    warnings.push('id should follow format: <publisher>.<name> (e.g. "acme.search-plugin")')
  }

  // 语义化版本校验
  if (m.version && typeof m.version === 'string' && !/^\d+\.\d+\.\d+/.test(m.version)) {
    warnings.push('version should follow semantic versioning (e.g. "1.0.0")')
  }

  return { valid: errors.length === 0, errors, warnings }
}
