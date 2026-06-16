// src/player/drmManager.ts — PB2-S1 DRM Compatibility Layer
// PATCH 2: DRM 检测与兼容层，为 Android TV / OTT 做准备
// 当前为 stub 实现，架构就绪后可接入实际 DRM 逻辑

import { DRMType } from './playerTypes'

interface DRMSupport {
  type: DRMType
  supported: boolean
  description: string
}

export class DRMManager {
  /** 检测视频是否需要 DRM */
  detectDRM(url: string): DRMType {
    if (url.includes('widevine') || url.includes('wv')) return DRMType.WIDEVINE
    if (url.includes('fairplay') || url.includes('fp')) return DRMType.FAIRPLAY
    if (url.includes('playready') || url.includes('pr')) return DRMType.PLAYREADY
    return DRMType.NONE
  }

  /** Widevine 支持检测 */
  isWidevineSupported(): boolean {
    // Stub: 检查 navigator.requestMediaKeySystemAccess
    if (typeof navigator !== 'undefined' && 'requestMediaKeySystemAccess' in navigator) {
      return true // 浏览器环境假定支持
    }
    return false
  }

  /** FairPlay 支持检测（macOS/Safari 专用） */
  isFairPlaySupported(): boolean {
    // Stub: FairPlay 仅 Safari/macOS 支持
    if (typeof navigator !== 'undefined' && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)) {
      return true
    }
    return false
  }

  /** PlayReady 支持检测（Windows/Edge/Xbox 专用） */
  isPlayReadySupported(): boolean {
    // Stub: PlayReady 在 Windows Edge 中支持
    if (typeof navigator !== 'undefined' && /Edge/.test(navigator.userAgent)) {
      return true
    }
    return false
  }

  /** 获取所有 DRM 支持状态 */
  getDRMSupport(): DRMSupport[] {
    return [
      { type: DRMType.WIDEVINE, supported: this.isWidevineSupported(), description: 'Widevine Modular (Chrome/Android TV)' },
      { type: DRMType.FAIRPLAY, supported: this.isFairPlaySupported(), description: 'Apple FairPlay (Safari/macOS)' },
      { type: DRMType.PLAYREADY, supported: this.isPlayReadySupported(), description: 'Microsoft PlayReady (Edge/Xbox)' },
    ]
  }
}
