<!-- modules/search-unified/ui/components/SearchSkeleton.vue — CE8-E -->
<script setup lang="ts">defineProps<{ variant?: 'overlay' | 'results' | 'cards' | 'suggestions' }>()</script>
<template>
  <div class="skeleton" :class="variant">
    <div v-for="i in (variant === 'suggestions' ? 5 : 3)" :key="i" class="skeleton-row">
      <div class="skeleton-poster"></div>
      <div class="skeleton-lines">
        <div class="skeleton-line w-60"></div>
        <div class="skeleton-line w-40"></div>
        <div class="skeleton-line w-80"></div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.skeleton { padding: 8px; }
.skeleton-row { display: flex; gap: 12px; padding: 10px; animation: pulse 1.5s infinite; }
.skeleton-poster { width: 48px; height: 72px; border-radius: 4px; background: var(--color-surface-hover); }
.skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; padding-top: 4px; }
.skeleton-line { height: 10px; border-radius: 4px; background: var(--color-surface-hover); }
.w-60 { width: 60%; } .w-40 { width: 40%; } .w-80 { width: 80%; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>
