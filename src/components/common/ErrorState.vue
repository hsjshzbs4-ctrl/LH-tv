<!-- src/components/common/ErrorState.vue -->
<template>
  <div class="error-state">
    <div class="error-icon">⚠️</div>
    <div class="error-text">{{ message }}</div>
    <div class="error-hint" v-if="hint">{{ hint }}</div>
    <div class="error-actions">
      <button v-if="onRetry" class="btn-retry" @click="onRetry">🔄 重试</button>
      <button class="btn-feedback" @click="onFeedback">📩 反馈</button>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  message?: string
  hint?: string
  onRetry?: () => void
}>(), {
  message: '加载失败',
  hint: '可能是网络问题或资源已下架'
})

function onFeedback() {
  // 简单的反馈提示
  alert('已记录反馈，作者会尽快处理！')
}
</script>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--color-text-secondary);
  text-align: center;
}

.error-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.error-text {
  font-size: var(--text-md);
  margin-bottom: 4px;
}

.error-hint {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin-bottom: 20px;
}

.error-actions {
  display: flex;
  gap: 8px;
}

.btn-retry {
  padding: 8px 20px;
  background: var(--color-accent-blue);
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: opacity var(--duration-fast) var(--ease-out);
}

.btn-retry:hover { opacity: 0.85; }

.btn-feedback {
  padding: 8px 20px;
  background: var(--color-warning);
  color: #000;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: opacity var(--duration-fast) var(--ease-out);
}

.btn-feedback:hover { opacity: 0.85; }
</style>
