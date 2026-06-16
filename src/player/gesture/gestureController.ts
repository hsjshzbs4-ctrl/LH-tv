// src/player/gesture/gestureController.ts — PB3-S1 Gesture Controller
// 唯一 Owner: 所有手势检测与状态管理

import {
  GestureType,
  GestureAction,
  DEFAULT_GESTURE_CONFIG,
} from './gestureTypes'
import { executeGestureAction } from './gestureActions'
import type { GestureConfig, GestureCallbacks } from './gestureTypes'

export class GestureController {
  private config: GestureConfig
  private callbacks: GestureCallbacks
  private lastTapTime = 0
  private lastTapX = 0
  private longPressTimer: ReturnType<typeof setTimeout> | null = null
  private _isLongPressing = false
  private _destroyed = false

  get isLongPressing(): boolean { return this._isLongPressing }

  constructor(callbacks: GestureCallbacks, config?: Partial<GestureConfig>) {
    this.config = { ...DEFAULT_GESTURE_CONFIG, ...config }
    this.callbacks = callbacks
  }

  /** 处理点击事件 (x: 点击横坐标, width: 容器宽度) */
  handleClick(x: number, width: number): void {
    if (this._destroyed) return
    const now = Date.now()
    const isLeft = x / width < this.config.leftZoneRatio

    if (
      now - this.lastTapTime < this.config.doubleTapWindow &&
      Math.abs(x - this.lastTapX) < 50
    ) {
      // 双击
      const action = isLeft
        ? GestureAction.SEEK_BACKWARD
        : GestureAction.SEEK_FORWARD
      executeGestureAction(action, this.config, this.callbacks)
      this.lastTapTime = 0 // 重置，防止三击
    } else {
      this.lastTapTime = now
      this.lastTapX = x
    }
  }

  /** 处理长按开始 */
  handleLongPressStart(): void {
    if (this._destroyed || this._isLongPressing) return
    this.longPressTimer = setTimeout(() => {
      this._isLongPressing = true
      executeGestureAction(GestureAction.SPEED_UP, this.config, this.callbacks)
    }, this.config.longPressDuration)
  }

  /** 处理长按结束 */
  handleLongPressEnd(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
    if (this._isLongPressing) {
      this._isLongPressing = false
      executeGestureAction(GestureAction.SPEED_RESTORE, this.config, this.callbacks)
    }
  }

  /** 更新回调（用于切换媒体时重新绑定） */
  updateCallbacks(callbacks: GestureCallbacks): void {
    this.callbacks = callbacks
  }

  /** 销毁 */
  destroy(): void {
    this._destroyed = true
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
    this._isLongPressing = false
  }
}
