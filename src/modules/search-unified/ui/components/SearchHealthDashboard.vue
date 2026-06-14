<!-- modules/search-unified/ui/components/SearchHealthDashboard.vue — CE8-E Dev only -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { SearchIPCClient } from '../../ipc/client/SearchIPCClient'

const props = defineProps<{ client: SearchIPCClient }>()
const health = ref<any>(null)

onMounted(async () => {
  const resp = await props.client.getHealth()
  if (!('code' in resp)) health.value = resp
})
</script>
<template>
  <div v-if="health" class="health-dashboard">
    <h4>Search Health</h4>
    <div class="health-grid">
      <div class="stat"><strong>State:</strong> {{ health.state }}</div>
      <div class="stat"><strong>Providers:</strong> {{ health.providers?.length }}</div>
      <div class="stat"><strong>Buffer:</strong> {{ health.analytics?.bufferSize }}</div>
      <div class="stat"><strong>Calls:</strong> {{ health.analytics?.totalCalls }}</div>
    </div>
    <div v-for="p in health.providers" :key="p.id" class="provider-row">
      <span :class="['status', p.available ? 'ok' : 'down']">●</span>
      {{ p.id }}
    </div>
  </div>
</template>
<style scoped>
.health-dashboard { padding: 16px; background: var(--color-surface); border-radius: 8px; }
.health-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 8px 0; }
.stat { font-size: 13px; }
.provider-row { display: flex; align-items: center; gap: 6px; font-size: 13px; padding: 2px 0; }
.status.ok { color: var(--color-success); } .status.down { color: var(--color-error); }
</style>
