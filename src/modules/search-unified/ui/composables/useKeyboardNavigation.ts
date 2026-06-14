// modules/search-unified/ui/composables/useKeyboardNavigation.ts — CE8-E
import { onMounted, onUnmounted } from 'vue'

export interface KeyboardActions {
  onArrowUp?: () => void
  onArrowDown?: () => void
  onEnter?: () => void
  onEscape?: () => void
  onTab?: () => void
}

export function useKeyboardNavigation(actions: KeyboardActions, enabled = () => true) {
  function handler(e: KeyboardEvent) {
    if (!enabled()) return
    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); actions.onArrowUp?.(); break
      case 'ArrowDown': e.preventDefault(); actions.onArrowDown?.(); break
      case 'Enter': e.preventDefault(); actions.onEnter?.(); break
      case 'Escape': e.preventDefault(); actions.onEscape?.(); break
      case 'Tab': actions.onTab?.(); break
    }
  }

  onMounted(() => document.addEventListener('keydown', handler))
  onUnmounted(() => document.removeEventListener('keydown', handler))
}
