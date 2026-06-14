<!-- modules/search-unified/ui/components/SearchResultCard.vue — CE8-E -->
<script setup lang="ts">
import type { UISearchResult } from '../types/search-ui.types'
import ProviderBadge from './ProviderBadge.vue'

defineProps<{ result: UISearchResult; selected?: boolean }>()
defineEmits(['click'])
</script>

<template>
  <div class="result-card" :class="{ selected }" role="option" :aria-selected="selected" @click="$emit('click')">
    <div class="poster">
      <img v-if="result.poster" :src="result.poster" :alt="result.title" loading="lazy" />
      <div v-else class="poster-placeholder">🎬</div>
    </div>
    <div class="info">
      <div class="title-row">
        <h4>{{ result.title }}</h4>
        <span v-if="result.year" class="year">{{ result.year }}</span>
      </div>
      <p v-if="result.overview" class="overview">{{ result.overview }}</p>
      <div class="meta">
        <span class="type-badge">{{ result.mediaType }}</span>
        <span class="score">★ {{ result.score }}</span>
        <ProviderBadge
          v-for="provider in result.providers"
          :key="provider"
          :provider="provider"
        />
        <span v-if="result.isPlayable" class="playable-badge">▶ Playable</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-card {
  display: flex; gap: 12px; padding: 10px; border-radius: 8px;
  cursor: pointer; transition: background 0.15s;
  border: 1px solid transparent;
}
.result-card:hover, .result-card.selected { background: var(--color-surface-hover); border-color: var(--color-primary); }
.poster { width: 64px; height: 96px; border-radius: 6px; overflow: hidden; flex-shrink: 0; background: var(--color-surface-hover); }
.poster img { width: 100%; height: 100%; object-fit: cover; }
.poster-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 28px; }
.info { flex: 1; min-width: 0; }
.title-row { display: flex; align-items: baseline; gap: 8px; }
.title-row h4 { margin: 0; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.year { font-size: 13px; color: var(--color-text-muted); }
.overview { font-size: 12px; color: var(--color-text-muted); margin: 4px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
.type-badge { font-size: 11px; padding: 1px 6px; border-radius: 4px; background: var(--color-surface-hover); text-transform: uppercase; }
.score { font-size: 12px; color: var(--color-warning); }
.playable-badge { font-size: 11px; padding: 1px 6px; border-radius: 4px; background: var(--color-success); color: #fff; }
</style>
