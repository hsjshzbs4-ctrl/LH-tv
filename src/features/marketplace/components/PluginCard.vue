<!-- P5.2: PluginCard.vue — 插件卡片组件 -->
<template>
  <div
    class="plugin-card"
    :class="{ 'plugin-card--installed': installed }"
    role="article"
    aria-label="Plugin card"
    @click="$emit('click')"
  >
    <div class="plugin-card__icon">
      <span class="plugin-card__icon-text">{{ plugin.name[0]?.toUpperCase() || '?' }}</span>
    </div>
    <div class="plugin-card__body">
      <h3 class="plugin-card__name">{{ plugin.name }}</h3>
      <p class="plugin-card__author">v{{ plugin.version }} · {{ plugin.author }}</p>
      <p class="plugin-card__desc">{{ truncatedDescription }}</p>
      <div class="plugin-card__meta">
        <span class="plugin-card__downloads">⬇ {{ formatDownloads(plugin.downloads) }}</span>
        <span class="plugin-card__rating">★ {{ plugin.rating.toFixed(1) }}</span>
      </div>
      <div class="plugin-card__tags">
        <span v-for="tag in plugin.tags.slice(0, 3)" :key="tag" class="plugin-card__tag">{{ tag }}</span>
      </div>
    </div>
    <div class="plugin-card__actions">
      <button
        v-if="!installed"
        class="btn btn--primary btn--sm"
        @click.stop="$emit('install')"
      >Install</button>
      <span v-else class="plugin-card__installed-badge">✓ Installed</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MarketplacePlugin } from '@/plugin-marketplace'

const props = defineProps<{
  plugin: MarketplacePlugin
  installed?: boolean
}>()

defineEmits<{
  click: []
  install: []
}>()

const truncatedDescription = computed(() => {
  const d = props.plugin.description
  return d.length > 120 ? d.slice(0, 117) + '...' : d
})

function formatDownloads(n: number): string {
  if (n >= 10000) return (n / 1000).toFixed(0) + 'k'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}
</script>

<style scoped>
.plugin-card {
  display: flex; gap: 12px; padding: 14px; border-radius: 10px;
  background: var(--card-bg, #fff); border: 1px solid var(--border-color, #e0e0e0);
  cursor: pointer; transition: box-shadow .15s, transform .15s;
}
.plugin-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); transform: translateY(-1px); }
.plugin-card--installed { border-color: var(--success-color, #4caf50); }
.plugin-card__icon { width: 44px; height: 44px; border-radius: 8px; background: var(--accent, #5c6bc0); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 18px; flex-shrink: 0; }
.plugin-card__body { flex: 1; min-width: 0; }
.plugin-card__name { margin: 0; font-size: 15px; font-weight: 600; }
.plugin-card__author { margin: 2px 0; font-size: 12px; color: #888; }
.plugin-card__desc { margin: 4px 0; font-size: 13px; color: #555; line-height: 1.4; }
.plugin-card__meta { display: flex; gap: 12px; font-size: 12px; color: #777; margin-top: 6px; }
.plugin-card__tags { display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap; }
.plugin-card__tag { background: #f0f0f0; padding: 2px 8px; border-radius: 12px; font-size: 11px; color: #555; }
.plugin-card__actions { display: flex; align-items: center; flex-shrink: 0; }
.plugin-card__installed-badge { color: var(--success-color, #4caf50); font-size: 13px; font-weight: 600; }
.btn { border: none; border-radius: 6px; cursor: pointer; font-weight: 600; padding: 6px 14px; }
.btn--primary { background: var(--accent, #5c6bc0); color: #fff; }
.btn--sm { font-size: 12px; padding: 5px 12px; }
</style>
