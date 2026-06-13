// src/shared/ipc/ipc.types.ts - IPC 类型映射（导入便利）
// 提供 channel → 请求/响应类型的映射，配合 AppInvoke 使用

import type { IpcChannelMap, AppInvoke } from '@/shared/types/ipc.types'

// Re-export for convenience
export type { IpcChannelMap, AppInvoke }
