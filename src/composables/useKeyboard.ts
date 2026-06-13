// src/composables/useKeyboard.ts - 全局键盘快捷键
import { onMounted, onUnmounted } from 'vue'

interface ShortcutDef {
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  handler: () => void
}

export function useKeyboard(shortcuts: Record<string, ShortcutDef>) {
  function onKeyDown(e: KeyboardEvent) {
    const def = shortcuts[e.code]
    if (!def) return

    if (def.ctrl && !e.ctrlKey && !e.metaKey) return
    if (def.alt && !e.altKey) return
    if (def.shift && !e.shiftKey) return

    // 如果不需要修饰键但用户按了，跳过（避免在输入框中触发）
    if (!def.ctrl && !def.alt && !def.shift) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    }

    e.preventDefault()
    def.handler()
  }

  onMounted(() => document.addEventListener('keydown', onKeyDown))
  onUnmounted(() => document.removeEventListener('keydown', onKeyDown))
}
