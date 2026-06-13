<!-- P5.2: RuntimeStatus.vue — 运行时状态指示器 -->
<template>
  <span class="runtime-status" :class="`runtime-status--${state}`">
    <span class="runtime-status__dot" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PluginState } from '@/plugin-marketplace'

const props = defineProps<{ state: string }>()

const labels: Record<string, string> = {
  [PluginState.ENABLED]: 'Enabled', [PluginState.DISABLED]: 'Disabled',
  [PluginState.INSTALLED]: 'Installed', [PluginState.STARTING]: 'Starting',
  [PluginState.RUNNING]: 'Running', [PluginState.STOPPING]: 'Stopping', [PluginState.FAILED]: 'Failed',
}
const label = computed(() => labels[props.state] || props.state)
</script>

<style scoped>
.runtime-status { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 12px; }
.runtime-status__dot { width: 8px; height: 8px; border-radius: 50%; }
.runtime-status--enabled, .runtime-status--running { background: #e8f5e9; color: #2e7d32; }
.runtime-status--enabled .runtime-status__dot, .runtime-status--running .runtime-status__dot { background: #4caf50; }
.runtime-status--disabled, .runtime-status--installed { background: #f5f5f5; color: #757575; }
.runtime-status--disabled .runtime-status__dot, .runtime-status--installed .runtime-status__dot { background: #9e9e9e; }
.runtime-status--failed { background: #fce4ec; color: #c62828; }
.runtime-status--failed .runtime-status__dot { background: #f44336; }
.runtime-status--starting, .runtime-status--stopping { background: #fff3e0; color: #e65100; }
.runtime-status--starting .runtime-status__dot, .runtime-status--stopping .runtime-status__dot { background: #ff9800; }
</style>
