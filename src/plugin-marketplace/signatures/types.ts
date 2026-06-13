// src/plugin-marketplace/signatures/types.ts — 签名系统类型
// P5.1 Plugin Marketplace Core

/** 签名信息 */
export interface PluginSignature {
  /** 签名算法 */
  algorithm: 'SHA256' | 'SHA512'
  /** 签名字符串 (hex) */
  signature: string
  /** 签名者公钥指纹 */
  signerKeyId: string
  /** 签名时间 */
  signedAt: number
}

/** 签名验证结果 */
export interface SignatureVerificationResult {
  valid: boolean
  /** 验证失败原因 */
  reason?: string
  /** 签名信息 (验证通过时) */
  signature?: PluginSignature
}
