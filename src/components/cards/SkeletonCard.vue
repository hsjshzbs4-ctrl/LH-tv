<!-- src/components/cards/SkeletonCard.vue - 骨架屏卡片 -->
<template>
  <div class="skeleton-card" :class="{ inline: inline }">
    <div class="skeleton-poster skeleton-shimmer"></div>
    <div class="skeleton-title skeleton-shimmer"></div>
    <div class="skeleton-text skeleton-shimmer"></div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  inline?: boolean // 横向滚动行用 flex-shrink
}>(), {
  inline: false
})
</script>

<style scoped>
.skeleton-card {
  width: 160px;
}

.skeleton-card.inline {
  flex-shrink: 0;
}

.skeleton-poster {
  width: 100%;
  padding-top: 140%;
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
}

.skeleton-title {
  height: 14px;
  width: 80%;
  margin-top: 8px;
  border-radius: var(--radius-xs);
  background: var(--color-bg-surface);
}

.skeleton-text {
  height: 10px;
  width: 50%;
  margin-top: 6px;
  border-radius: var(--radius-xs);
  background: var(--color-bg-surface);
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--color-bg-surface) 25%,
    var(--color-bg-hover) 50%,
    var(--color-bg-surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
</style>
