<!-- modules/search-unified/ui/components/ProviderBadge.vue — CE8-E -->
<script setup lang="ts">
defineProps<{ provider: string }>()
const colors: Record<string, string> = { local: '#4caf50', jellyfin: '#aa5cc3', plex: '#e5a00d', emby: '#52b54b', tmdb: '#0d253f' }
</script>

<template>
  <span class="provider-badge" :style="{ background: colors[provider] ?? '#666' }">
    {{ provider }}
  </span>
</template>

<style scoped>
.provider-badge { font-size: 10px; padding: 1px 5px; border-radius: 4px; color: #fff; text-transform: capitalize; }
</style>
