// src/shared/types/common.types.ts - 通用类型定义

/** 可空类型 */
export type Nullable<T> = T | null

/** 深层只读 */
export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K]
}

/** 操作结果（成功/失败） */
export type Result<T, E = Error> =
  | { ok: true; data: T }
  | { ok: false; error: E }

/** 时间戳（毫秒） */
export type Timestamp = number

/** JSON 安全值类型 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

/** JSON 安全对象 */
export type JsonObject = Record<string, JsonValue>
