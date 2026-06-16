// src/player/gesture/gestureTypes.ts — PB3-S1 Gesture 类型定义

/** 手势类型 */
export enum GestureType {
  DOUBLE_TAP_LEFT = 'double_tap_left',
  DOUBLE_TAP_RIGHT = 'double_tap_right',
  LONG_PRESS = 'long_press',
  LONG_PRESS_RELEASE = 'long_press_release',
}

/** 手势动作 */
export enum GestureAction {
  SEEK_BACKWARD = 'seek_backward',
  SEEK_FORWARD = 'seek_forward',
  SPEED_UP = 'speed_up',
  SPEED_RESTORE = 'speed_restore',
}

/** 手势配置 */
export interface GestureConfig {
  /** 双击时间窗口 (ms) */
  doubleTapWindow: number
  /** 双击 seek 步长 (秒) */
  seekStep: number
  /** 长按触发时长 (ms) */
  longPressDuration: number
  /** 长按倍速 */
  longPressSpeed: number
  /** 左侧区域比例 (0-1) */
  leftZoneRatio: number
}

export const DEFAULT_GESTURE_CONFIG: GestureConfig = {
  doubleTapWindow: 300,
  seekStep: 10,
  longPressDuration: 500,
  longPressSpeed: 2,
  leftZoneRatio: 0.4,
}

/** 手势事件回调 */
export interface GestureCallbacks {
  onSeek: (delta: number) => void
  onSpeedChange: (speed: number) => void
}
