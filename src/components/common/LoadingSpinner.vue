<!-- src/components/common/LoadingSpinner.vue -->
<template>
  <div class="loading-spinner" :style="{ padding: padding + 'px' }">
    <div class="spinner" :style="{ width: size + 'px', height: size + 'px' }"></div>
    <p v-if="message" class="loading-msg">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  message?: string
  size?: number
  padding?: number
}>(), {
  size: 32,
  padding: 40
})
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.spinner {
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-msg {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}
</style>
