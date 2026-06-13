<!-- P5.2: DeveloperToolsPage.vue — 开发者工具 -->
<template>
  <div class="dev-page">
    <h1>Developer Tools</h1>
    <p class="dev-subtitle">Plugin diagnostics, runtime monitoring, and sandbox inspection.</p>

    <div v-if="plugins.length === 0" class="empty"><p>No installed plugins to inspect.</p></div>

    <div v-for="p in plugins" :key="p.id" class="dev-section">
      <h3>{{ p.name }}</h3>
      <div class="dev-grid">
        <div class="dev-card">
          <span class="dev-card__label">Version</span>
          <span class="dev-card__value">{{ p.version }}</span>
        </div>
        <div class="dev-card">
          <span class="dev-card__label">State</span>
          <RuntimeStatus :state="lifecycle.getState(p.id)" />
        </div>
        <div class="dev-card">
          <span class="dev-card__label">Errors</span>
          <span class="dev-card__value">{{ lifecycle.getMetrics(p.id).errors }}</span>
        </div>
        <div class="dev-card">
          <span class="dev-card__label">State Changes</span>
          <span class="dev-card__value">{{ lifecycle.getMetrics(p.id).stateChanges }}</span>
        </div>
        <div class="dev-card">
          <span class="dev-card__label">Sandbox</span>
          <span class="dev-card__value">{{ sandbox.isIsolated(p.id) ? 'Isolated' : 'Direct' }}</span>
        </div>
        <div class="dev-card">
          <span class="dev-card__label">Installed</span>
          <span class="dev-card__value">{{ new Date(p.installedAt).toLocaleDateString() }}</span>
        </div>
      </div>
      <!-- Error log -->
      <div v-if="lifecycle.getMetrics(p.id).lastError" class="dev-error">
        <strong>Last Error:</strong> {{ lifecycle.getMetrics(p.id).lastError }}
        <br /><small>{{ new Date(lifecycle.getMetrics(p.id).lastErrorTime || 0).toLocaleString() }}</small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { installedPluginService } from '../services/InstalledPluginService'
import { pluginLifecycleManager, pluginSandboxManager } from '@/plugin-marketplace'
import RuntimeStatus from '../components/RuntimeStatus.vue'
import type { InstalledPluginMeta } from '@/plugin-marketplace'

const lifecycle = pluginLifecycleManager
const sandbox = pluginSandboxManager
const plugins = ref<InstalledPluginMeta[]>([])

onMounted(() => {
  plugins.value = installedPluginService.getAll()
  // Register instances
  for (const p of plugins.value) {
    lifecycle.getOrCreate(p.id)
    sandbox.isolate(p.id)
  }
})
</script>

<style scoped>
.dev-page { padding: 24px; max-width: 1000px; margin: 0 auto; }
.dev-page h1 { font-size: 24px; margin-bottom: 4px; }
.dev-subtitle { color: #777; margin-bottom: 24px; }
.dev-section { margin-bottom: 24px; border: 1px solid #eee; border-radius: 10px; padding: 16px; }
.dev-section h3 { margin: 0 0 12px; font-size: 16px; }
.dev-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.dev-card { background: #f9f9f9; padding: 10px 14px; border-radius: 8px; display: flex; flex-direction: column; gap: 4px; }
.dev-card__label { font-size: 11px; color: #999; text-transform: uppercase; font-weight: 600; letter-spacing: .5px; }
.dev-card__value { font-size: 14px; font-weight: 600; }
.dev-error { margin-top: 12px; padding: 10px; background: #fff3e0; border-radius: 6px; font-size: 13px; color: #e65100; }
.empty { text-align: center; padding: 40px; color: #999; }
</style>
