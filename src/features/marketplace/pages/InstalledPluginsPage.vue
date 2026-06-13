<!-- P5.2: InstalledPluginsPage.vue — 已安装插件管理 -->
<template>
  <div class="installed-page">
    <header class="installed-header">
      <h1>Installed Plugins</h1>
      <div class="installed-actions">
        <button class="btn btn--sm" @click="store.refresh()">Refresh</button>
      </div>
    </header>

    <nav class="installed-tabs">
      <button v-for="tab in tabs" :key="tab.id"
        :class="{ 'tab--active': activeTab === tab.id }"
        @click="activeTab = tab.id">{{ tab.label }} ({{ tab.count }})</button>
    </nav>

    <div v-if="filteredPlugins.length === 0" class="empty-state">
      <p>No plugins here.</p>
    </div>

    <div v-else class="installed-list">
      <div v-for="p in filteredPlugins" :key="p.id" class="installed-item">
        <div class="installed-item__info">
          <strong>{{ p.name }}</strong>
          <span class="text-muted">v{{ p.version }} · {{ p.id }}</span>
          <RuntimeStatus :state="store.getState(p.id)" />
        </div>
        <div class="installed-item__actions">
          <button v-if="!p.enabled" class="btn btn--primary btn--xs" @click="store.enablePlugin(p.id)">Enable</button>
          <button v-else class="btn btn--outline btn--xs" @click="store.disablePlugin(p.id)">Disable</button>
          <button class="btn btn--danger btn--xs" @click="onRemove(p.id)">Remove</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useInstalledPluginsStore } from '../stores/installed-plugins.store'
import RuntimeStatus from '../components/RuntimeStatus.vue'

const store = useInstalledPluginsStore()
const activeTab = ref('all')

const tabs = computed(() => [
  { id: 'all', label: 'All', count: store.plugins.length },
  { id: 'enabled', label: 'Enabled', count: store.enabled.length },
  { id: 'disabled', label: 'Disabled', count: store.disabled.length },
])

const filteredPlugins = computed(() => {
  if (activeTab.value === 'enabled') return store.enabled
  if (activeTab.value === 'disabled') return store.disabled
  return store.plugins
})

async function onRemove(id: string) {
  if (confirm('Remove this plugin?')) await store.uninstall(id)
}

onMounted(() => store.refresh())
</script>

<style scoped>
.installed-page { padding: 24px; max-width: 900px; margin: 0 auto; }
.installed-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.installed-header h1 { margin: 0; font-size: 24px; }
.installed-tabs { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px; }
.installed-tabs button { background: none; border: none; padding: 8px 16px; cursor: pointer; font-size: 13px; color: #777; border-bottom: 2px solid transparent; }
.installed-tabs .tab--active { color: var(--accent, #5c6bc0); border-bottom-color: var(--accent, #5c6bc0); font-weight: 600; }
.installed-item { display: flex; justify-content: space-between; align-items: center; padding: 14px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 8px; }
.installed-item__info { display: flex; flex-direction: column; gap: 4px; }
.text-muted { color: #999; font-size: 12px; }
.installed-item__actions { display: flex; gap: 6px; }
.empty-state { text-align: center; padding: 40px; color: #999; }
.btn { border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn--xs { font-size: 11px; padding: 4px 10px; }
.btn--sm { font-size: 12px; padding: 6px 14px; }
.btn--primary { background: var(--accent, #5c6bc0); color: #fff; }
.btn--outline { background: #fff; color: var(--accent, #5c6bc0); border: 1px solid var(--accent, #5c6bc0); }
.btn--danger { background: #f44336; color: #fff; }
</style>
