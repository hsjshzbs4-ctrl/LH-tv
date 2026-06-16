// src/core/player/adapters/HLSAdapter.ts - HLS.js 适配器
// 封装 hls.js 的 loadSource / attachMedia / destroy

import Hls from 'hls.js'
import type { AdapterEventCallbacks } from '../types/adapter.types'
import { BaseAdapter } from './BaseAdapter'

export class HLSAdapter extends BaseAdapter {
  private hls: Hls | null = null
  private headers: Record<string, string> | undefined
  private currentUrl = ''

  constructor(container: HTMLElement, callbacks: AdapterEventCallbacks = {}, headers?: Record<string, string>) {
    super(container, callbacks)
    this.headers = headers
  }

  async load(url: string): Promise<void> {
    // 销毁旧实例
    this.cleanupHls()

    // 创建新的 video 元素
    const video = this.video || this.createVideoElement()
    if (!video) throw new Error('无法创建 video 元素')

    this.currentUrl = url

    // 检查 HLS 支持
    if (!Hls.isSupported()) {
      // 降级：回退到原生播放（浏览器原生 HLS 支持，如 Safari）
      console.log('[HLSAdapter] HLS.js 不支持，降级到原生 video')
      video.src = url
      video.load()
      return
    }

    // 创建 HLS 实例
    this.hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
      backBufferLength: 90,
    })

    // 自定义请求头
    if (this.headers?.Referer || this.headers?.referer) {
      const referer = this.headers.Referer || this.headers.referer
      this.hls.config.xhrSetup = (xhr) => {
        xhr.setRequestHeader('Referer', referer || '')
      }
    }

    // 绑定 HLS 事件
    this.hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        const errorType = data.type
        const details = data.details || 'unknown'
        this.callbacks.onError?.(`HLS 错误 [${errorType}]: ${details}`)

        // 不可恢复的错误，销毁 HLS 实例
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          this.cleanupHls()
        }
      }
    })

    this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
      this.callbacks.onReady?.()
      this.callbacks.onHLSReady?.(this.hls)  // S3A-4: 传出 HLS 实例给 QualityManager
    })

    this.hls.loadSource(url)
    this.hls.attachMedia(video)
  }

  override destroy(): void {
    this.cleanupHls()
    super.destroy()
  }

  private cleanupHls(): void {
    if (this.hls) {
      this.hls.destroy()
      this.hls = null
    }
  }

  /** 获取当前 URL（用于重新加载等场景） */
  getCurrentUrl(): string {
    return this.currentUrl
  }
}
