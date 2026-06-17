<!-- MetricCard.vue — 可复用指标卡片 -->
<template>
  <div class="metric-card">
    <div class="metric-label">{{ label }}</div>
    <div class="metric-value">{{ formattedValue }}</div>
    <div v-if="trend !== undefined" class="metric-trend" :class="trendClass">
      {{ trend >= 0 ? '↑' : '↓' }} {{ Math.abs(trend) }}%
    </div>
    <div v-if="subtitle" class="metric-subtitle">{{ subtitle }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    value: number
    trend?: number
    subtitle?: string
    format?: 'number' | 'duration' | 'percent'
  }>(),
  { format: 'number', trend: undefined, subtitle: undefined },
)

const formattedValue = computed(() => {
  switch (props.format) {
    case 'duration': {
      const hours = Math.floor(props.value / 3600000)
      const mins = Math.floor((props.value % 3600000) / 60000)
      return `${hours}h ${mins}m`
    }
    case 'percent':
      return `${(props.value * 100).toFixed(1)}%`
    default:
      return props.value.toLocaleString()
  }
})

const trendClass = computed(() =>
  props.trend !== undefined && props.trend >= 0 ? 'trend-up' : 'trend-down',
)
</script>

<style scoped>
.metric-card {
  background: var(--bg-secondary, #1e1e2e);
  border-radius: 12px;
  padding: 20px;
  min-width: 180px;
}
.metric-label {
  font-size: 13px;
  color: var(--text-secondary, #888);
  margin-bottom: 8px;
}
.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary, #fff);
}
.metric-trend {
  font-size: 13px;
  margin-top: 4px;
}
.trend-up {
  color: var(--success, #4caf50);
}
.trend-down {
  color: var(--error, #f44336);
}
.metric-subtitle {
  font-size: 12px;
  color: var(--text-secondary, #888);
  margin-top: 4px;
}
</style>
