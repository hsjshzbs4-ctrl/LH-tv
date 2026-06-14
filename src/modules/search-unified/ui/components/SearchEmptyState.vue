<!-- modules/search-unified/ui/components/SearchEmptyState.vue — CE8-E -->
<script setup lang="ts">
defineProps<{ variant?: 'no-results' | 'error' | 'no-history' | 'no-trends' | 'provider-offline' }>()
const messages: Record<string, { icon: string; title: string; desc: string }> = {
  'no-results': { icon: '🔍', title: 'No results found', desc: 'Try a different search term' },
  'error': { icon: '⚠️', title: 'Search error', desc: 'Something went wrong. Please try again.' },
  'no-history': { icon: '🕐', title: 'No search history', desc: 'Your recent searches will appear here' },
  'no-trends': { icon: '📈', title: 'No trending data', desc: 'Trending searches will appear here' },
  'provider-offline': { icon: '🔌', title: 'Provider offline', desc: 'One or more providers are currently unavailable' },
}
</script>
<template>
  <div class="empty-state">
    <span class="icon">{{ messages[variant!]?.icon ?? '📭' }}</span>
    <h4>{{ messages[variant!]?.title ?? 'Nothing here' }}</h4>
    <p>{{ messages[variant!]?.desc }}</p>
  </div>
</template>
<style scoped>
.empty-state { text-align: center; padding: 32px 16px; color: var(--color-text-muted); }
.icon { font-size: 32px; display: block; margin-bottom: 8px; }
h4 { margin: 4px 0; color: var(--color-text); }
p { margin: 0; font-size: 13px; }
</style>
