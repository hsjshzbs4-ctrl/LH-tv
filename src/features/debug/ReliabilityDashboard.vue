<!-- src/features/debug/ReliabilityDashboard.vue — PB3-S3-7 -->
<template>
  <div v-if="visible" class="reliability-dashboard">
    <div class="rd-header">
      <span class="rd-title">🛡️ Reliability</span>
      <button class="rd-close" @click="visible = false">✕</button>
    </div>
    <div class="rd-section">
      <div class="rd-section-title">Recovery</div>
      <div class="rd-row"><span>Recoveries</span><span class="rd-ok">{{ recoveryCount }}</span></div>
    </div>
    <div class="rd-section">
      <div class="rd-section-title">Crashes</div>
      <div class="rd-row"><span>Total</span><span :class="crashCount > 0 ? 'rd-warn' : 'rd-ok'">{{ crashCount }}</span></div>
    </div>
    <div class="rd-section">
      <div class="rd-section-title">Network</div>
      <div class="rd-row"><span>Status</span><span :class="isOnline ? 'rd-ok' : 'rd-warn'">{{ isOnline ? 'ONLINE' : 'OFFLINE' }}</span></div>
      <div class="rd-row"><span>Quality</span><span class="rd-ok">{{ networkQuality }}</span></div>
    </div>
    <div class="rd-section">
      <div class="rd-section-title">Memory</div>
      <div class="rd-row"><span>Warnings</span><span :class="memoryWarnings > 0 ? 'rd-warn' : 'rd-ok'">{{ memoryWarnings }}</span></div>
    </div>
    <div class="rd-section">
      <div class="rd-section-title">Telemetry</div>
      <div class="rd-row"><span>Startup</span><span class="rd-ok">{{ startupTime }}ms</span></div>
      <div class="rd-row"><span>Events</span><span>{{ telemetryEvents }}</span></div>
    </div>
  </div>
  <button v-else class="rd-toggle" @click="visible = true" title="可靠性面板">🛡️</button>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
const recoveryCount = ref(0)
const crashCount = ref(0)
const isOnline = ref(true)
const networkQuality = ref('ONLINE')
const memoryWarnings = ref(0)
const startupTime = ref(0)
const telemetryEvents = ref(0)

// 定期更新
if (typeof window !== 'undefined') {
  setInterval(() => {
    isOnline.value = navigator.onLine
  }, 5000)
}
</script>

<style scoped>
.reliability-dashboard {
  position: fixed; top: 8px; right: 200px; z-index: 9998;
  background: rgba(10,10,30,0.92); border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px; padding: 10px 14px; min-width: 200px;
  font-size: 11px; color: rgba(255,255,255,0.7); backdrop-filter: blur(8px);
}
.rd-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.rd-title { font-weight: 600; font-size: 12px; color: #fff; }
.rd-close { background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; }
.rd-section { margin-bottom: 6px; }
.rd-section-title { color: rgba(255,255,255,0.4); font-size: 10px; text-transform: uppercase; margin-bottom: 2px; }
.rd-row { display: flex; justify-content: space-between; }
.rd-ok { color: #4caf50; font-family: monospace; }
.rd-warn { color: #e8a850; font-family: monospace; }
.rd-toggle {
  position: fixed; bottom: 48px; right: 12px; z-index: 9998;
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(10,10,30,0.8); border: 1px solid rgba(255,255,255,0.15);
  color: #4caf50; cursor: pointer; font-size: 14px; backdrop-filter: blur(4px);
}
</style>
