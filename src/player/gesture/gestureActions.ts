// src/player/gesture/gestureActions.ts — PB3-S1 Gesture 动作映射

import { GestureAction } from './gestureTypes'
import type { GestureConfig, GestureCallbacks } from './gestureTypes'

/** 执行手势对应的动作 */
export function executeGestureAction(
  action: GestureAction,
  config: GestureConfig,
  callbacks: GestureCallbacks,
): void {
  switch (action) {
    case GestureAction.SEEK_BACKWARD:
      callbacks.onSeek(-config.seekStep)
      break
    case GestureAction.SEEK_FORWARD:
      callbacks.onSeek(config.seekStep)
      break
    case GestureAction.SPEED_UP:
      callbacks.onSpeedChange(config.longPressSpeed)
      break
    case GestureAction.SPEED_RESTORE:
      callbacks.onSpeedChange(1)
      break
  }
}
