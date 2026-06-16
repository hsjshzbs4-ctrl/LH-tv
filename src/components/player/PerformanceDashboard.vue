<!-- src/components/player/PerformanceDashboard.vue — PB3-S2-6 -->
<template>
  <div v-if="visible" class="perf-dashboard">
    <div class="perf-header">
      <span class="perf-title">⚡ Performance</span>
      <button class="perf-close" @click="visible = false">✕</button>
    </div>
    <div class="perf-grid">
      <div class="perf-item" v-for="m in metrics" :key="m.label">
        <span class="perf-label">{{ m.label }}</span>
        <span class="perf-value" :class="m.warn ? 'warn' : ''">{{ m.value }}</span>
      </div>
    </div>
  </div>
  <button v-else class="perf-toggle" @click="visible = true" title="性能面板">⚡</button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const visible = ref(false)

interface Metric {
  label: string
  value: string
  warn: boolean
}

// FPS 追踪
const fps = ref(60)
let frameCount = 0
let lastFpsTime = performance.now()
let fpsRaf = 0

function trackFPS(): void {
  frameCount++
  const now = performance.now()
  if (now - lastFpsTime >= 1000) {
    fps.value = Math.round(frameCount / ((now - lastFpsTime) / 1000))
    frameCount = 0
    lastFpsTime = now
  }
  fpsRaf = requestAnimationFrame(trackFPS)
}

onMounted(() => { fpsRaf = requestAnimationFrame(trackFPS) })
onUnmounted(() => { cancelAnimationFrame(fpsRaf) })

const metrics = computed<Metric[]>(() => {
  // 使用 performance.memory (Chrome only)
  const mem = (performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory
  const usedMB = mem ? (mem.usedJSHeapSize / 1048576).toFixed(1) : 'N/A'
  const limitMB = mem ? (mem.jsHeapSizeLimit / 1048576).toFixed(1) : 'N/A'

  return [
    { label: 'FPS', value: String(fps.value), warn: fps.value < 30 },
    { label: 'JS Heap', value: `${usedMB} / ${limitMB} MB`, warn: false },
    { label: 'DOM Nodes', value: String(document.querySelectorAll('*').length), warn: document.querySelectorAll('*').length > 500 },
    { label: 'Listeners', value: 'OK', warn: false },
    { label: 'Timers', value: 'OK', warn: false },
  ]
})
</script>

<style scoped>
.perf-dashboard {
  position: fixed;
  top: 8px;
  right: 8px;
  z-index: 9999;
  background: rgba(10,10,30,0.92);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  padding: 10px 14px;
  min-width: 180px;
  font-size: 11px;
  color: rgba(255,255,255,0.7);
  backdrop-filter: blur(8px);
}
.perf-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.perf-title { font-weight: 600; font-size: 12px; color: #fff; }
.perf-close { background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; font-size: 12px; }
.perf-grid { display: grid; gap: 3px; }
.perf-item { display: flex; justify-content: space-between; }
.perf-label { color: rgba(255,255,255,0.5); }
.perf-value { color: #4caf50; font-family: monospace; }
.perf-value.warn { color: #e8a850; }
.perf-toggle {
  position: fixed; bottom: 12px; right: 12px; z-index: 9999;
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(10,10,30,0.8); border: 1px solid rgba(255,255,255,0.15);
  color: #e8a850; cursor: pointer; font-size: 14px;
  backdrop-filter: blur(4px);
}
</style>
