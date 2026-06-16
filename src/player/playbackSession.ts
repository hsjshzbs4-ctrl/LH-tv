// src/player/playbackSession.ts — PB2-S1 Playback Session
// 追踪播放会话状态：当前媒体/集数/进度/观看时长

import type { PlaybackSession } from './playerTypes'

function generateSessionId(): string {
  return `pb-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export class PlaybackSessionTracker {
  private session: PlaybackSession | null = null
  private tickTimer: ReturnType<typeof setInterval> | null = null
  private persistTimer: ReturnType<typeof setInterval> | null = null

  /** 开始新会话 */
  begin(mediaId: string, episodeId: string, providerId: string, duration: number = 0): PlaybackSession {
    this.end()
    this.session = {
      sessionId: generateSessionId(),
      mediaId,
      episodeId,
      providerId,
      startTime: Date.now(),
      progress: 0,
      duration,
      watchTime: 0,
      lastPosition: 0,
    }
    this.startTimers()
    return this.session
  }

  /** 更新进度 */
  updateProgress(currentTime: number, duration: number): void {
    if (!this.session) return
    this.session.progress = duration > 0 ? currentTime / duration : 0
    this.session.duration = duration
    this.session.lastPosition = currentTime
  }

  /** 获取当前会话 */
  getSession(): PlaybackSession | null { return this.session }

  /** 是否活跃 */
  isActive(): boolean { return this.session !== null }

  /** 结束会话 */
  end(): void {
    if (this.session) {
      this.session.watchTime = Date.now() - this.session.startTime
      this.persist()
    }
    this.session = null
    this.stopTimers()
  }

  private startTimers(): void {
    // 每 10 秒持久化
    this.persistTimer = setInterval(() => this.persist(), 10_000)
  }

  private stopTimers(): void {
    if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null }
    if (this.persistTimer) { clearInterval(this.persistTimer); this.persistTimer = null }
  }

  private persist(): void {
    if (!this.session) return
    try {
      sessionStorage.setItem('player.session', JSON.stringify(this.session))
    } catch { /* 静默 */ }
  }
}
