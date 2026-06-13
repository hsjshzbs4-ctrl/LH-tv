// src/core/provider-sdk/validator/ProviderValidator.ts - Provider 接口校验器
// P4.3 Provider SDK
//
// 职责：校验 Provider 实例是否实现了必需接口
// 禁止：Provider 调用、UI

import type { IProvider } from '@provider-contracts'

/** Provider 必须实现的接口方法 */
const REQUIRED_METHODS: (keyof IProvider)[] = [
  'search',
  'detail',
  'healthCheck',
]

export class ProviderValidator {
  /**
   * 校验 Provider 实例是否实现了必需接口
   * @returns 错误列表，空数组表示通过
   */
  validate(instance: IProvider, manifestId: string): string[] {
    const errors: string[] = []

    if (!instance || typeof instance !== 'object') {
      return [`Provider "${manifestId}" instance is null or not an object`]
    }

    // 检查必需属性
    if (typeof instance.id !== 'string') {
      errors.push(`Provider "${manifestId}" missing "id" property`)
    }
    if (typeof instance.name !== 'string') {
      errors.push(`Provider "${manifestId}" missing "name" property`)
    }

    // 检查必需方法
    for (const method of REQUIRED_METHODS) {
      if (typeof (instance as unknown as Record<string, unknown>)[method] !== 'function') {
        errors.push(
          `Provider "${manifestId}" missing required method: ${method}()`,
        )
      }
    }

    return errors
  }
}
