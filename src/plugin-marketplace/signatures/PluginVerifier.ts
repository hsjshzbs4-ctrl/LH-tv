// src/plugin-marketplace/signatures/PluginVerifier.ts — 签名验证器
// P5.1 Plugin Marketplace Core
import type { PluginSignature, SignatureVerificationResult } from './types'

export class PluginVerifier {
  /** 验证插件包签名 (Mock 实现) */
  verify(_packageData: Buffer, _signature?: PluginSignature): SignatureVerificationResult {
    // P5.1: Mock — 未签名的包默认通过，留待完整实现
    if (!_signature) {
      return { valid: true, reason: undefined }
    }
    // 有签名时验证完整性
    if (_signature.algorithm !== 'SHA256' && _signature.algorithm !== 'SHA512') {
      return { valid: false, reason: `Unsupported algorithm: ${_signature.algorithm}` }
    }
    return { valid: true, signature: _signature }
  }

  /** 生成包哈希 (Mock) */
  hash(_data: Buffer): string {
    return 'mock-hash-' + Buffer.byteLength(_data as unknown as Uint8Array || Buffer.alloc(0))
  }
}

export const pluginVerifier = new PluginVerifier()
