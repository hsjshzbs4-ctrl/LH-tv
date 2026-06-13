<!-- P5.2: PluginGrid.vue — 插件网格布局 -->
<template>
  <div>
    <div v-if="plugins.length === 0" class="plugin-grid__empty">
      <slot name="empty">
        <p>No plugins found.</p>
      </slot>
    </div>
    <div v-else class="plugin-grid">
      <PluginCard
        v-for="p in plugins"
        :key="p.id"
        :plugin="p"
        :installed="isInstalled(p.id)"
        @click="$emit('pluginClick', p)"
        @install="$emit('pluginInstall', p)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import PluginCard from './PluginCard.vue'
import type { MarketplacePlugin } from '@/plugin-marketplace'

defineProps<{
  plugins: MarketplacePlugin[]
  isInstalled: (id: string) => boolean
}>()

defineEmits<{
  pluginClick: [plugin: MarketplacePlugin]
  pluginInstall: [plugin: MarketplacePlugin]
}>()
</script>

<style scoped>
.plugin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 12px; }
.plugin-grid__empty { text-align: center; padding: 40px; color: #999; }
</style>
