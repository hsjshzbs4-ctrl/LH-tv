<!-- src/components/common/EmptyState.vue -->
<template>
  <div class="empty-state">
    <div class="empty-icon">{{ icon }}</div>
    <div class="empty-text">{{ message }}</div>
    <button v-if="actionLabel" class="empty-action" @click="$emit('action')">
      {{ actionLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  message?: string
  icon?: string
  actionLabel?: string
}>(), {
  message: '暂无内容',
  icon: '📭'
})

defineEmits<{ action: [] }>()
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--color-text-tertiary);
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: var(--text-md);
  margin-bottom: 16px;
}

.empty-action {
  padding: 8px 24px;
  background: var(--color-accent);
  color: var(--color-text-inverse);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition: opacity var(--duration-fast) var(--ease-out);
}

.empty-action:hover { opacity: 0.85; }
</style>
