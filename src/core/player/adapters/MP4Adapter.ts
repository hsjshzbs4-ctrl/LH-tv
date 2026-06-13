// src/core/player/adapters/MP4Adapter.ts - 原生 MP4/TS 适配器
// 使用原生 <video> 标签直接播放

import { BaseAdapter } from './BaseAdapter'

export class MP4Adapter extends BaseAdapter {
  async load(url: string): Promise<void> {
    // 首次创建或复用已有 video 元素
    if (!this.video) {
      this.createVideoElement()
    }

    // 切换源
    if (this.video) {
      this.video.src = url
      this.video.load()
    }
  }
}
