<!-- src/components/common/Toast.vue - 全局 Toast 通知 -->
<template>
  <Teleport to="body">
    <TransitionGroup name="list" tag="div" class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="toast.type"
        @click="dismiss(toast.id)"
      >
        <span class="toast-icon">{{ iconFor(toast.type) }}</span>
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface ToastItem {
  id: number
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

const toasts = ref<ToastItem[]>([])
let nextId = 0

function iconFor(type: string): string {
  const map: Record<string, string> = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }
  return map[type] || 'ℹ️'
}

function show(message: string, type: ToastItem['type'] = 'info', duration = 3000) {
  const id = ++nextId
  toasts.value.push({ id, message, type })
  setTimeout(() => dismiss(id), duration)
}

function dismiss(id: number) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

// 暴露到全局
if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).$toast = { show }
}

defineExpose({ show })
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
  z-index: var(--z-toast);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-overlay);
  cursor: pointer;
  pointer-events: all;
  min-width: 200px;
  max-width: 360px;
  font-size: var(--text-sm);
  line-height: 1.4;
}

.toast.success { border-left: 3px solid var(--color-accent-green); }
.toast.error   { border-left: 3px solid var(--color-danger); }
.toast.warning { border-left: 3px solid var(--color-warning); }
.toast.info    { border-left: 3px solid var(--color-accent-blue); }

.toast-icon {
  flex-shrink: 0;
  font-size: 16px;
}
</style>
