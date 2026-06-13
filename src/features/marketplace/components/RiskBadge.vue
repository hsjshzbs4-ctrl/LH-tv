<!-- P5.2: RiskBadge.vue — 风险等级徽章 -->
<template>
  <span class="risk-badge" :class="`risk-badge--${level}`">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ level: 'low' | 'medium' | 'high' | 'critical' }>()

const label = computed(() => {
  const map: Record<string, string> = { low: 'Low Risk', medium: 'Medium Risk', high: 'High Risk', critical: 'Critical Risk' }
  return map[props.level] || props.level
})
</script>

<style scoped>
.risk-badge { padding: 4px 12px; border-radius: 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
.risk-badge--low { background: #e8f5e9; color: #2e7d32; }
.risk-badge--medium { background: #fff3e0; color: #e65100; }
.risk-badge--high { background: #fce4ec; color: #c62828; }
.risk-badge--critical { background: #f44336; color: #fff; }
</style>
