<!-- P5.2: MarketplaceDetailPage.vue — 插件详情页 -->
<template>
  <div class="detail-page" v-if="plugin">
    <button class="back-btn" @click="$router.back()">← Back</button>
    <div class="detail-header">
      <div class="detail-icon">{{ plugin.name[0]?.toUpperCase() }}</div>
      <div>
        <h1>{{ plugin.name }}</h1>
        <p>v{{ plugin.version }} · by {{ plugin.author }}</p>
      </div>
    </div>
    <p class="detail-desc">{{ plugin.description }}</p>
    <div class="detail-meta">
      <span>⬇ {{ plugin.downloads.toLocaleString() }}</span>
      <span>★ {{ plugin.rating.toFixed(1) }}</span>
      <span>SDK {{ plugin.sdkVersion }}</span>
    </div>

    <section class="detail-section">
      <h3>Permissions Required</h3>
      <div class="detail-perms">
        <PermissionBadge v-for="p in plugin.permissions" :key="p" :permission="p" :risk="permRisk(p)" />
      </div>
      <RiskBadge :level="overallRisk" />
    </section>

    <section class="detail-actions">
      <button v-if="!installed" class="btn btn--primary btn--lg" @click="install">Install Plugin</button>
      <template v-else>
        <button class="btn btn--primary btn--lg" disabled>✓ Installed</button>
        <button class="btn btn--danger btn--lg" @click="uninstall">Uninstall</button>
      </template>
    </section>
  </div>
  <div v-else class="detail-empty"><p>Plugin not found.</p></div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { marketplaceService } from '../services/MarketplaceService'
import { installedPluginService } from '../services/InstalledPluginService'
import PermissionBadge from '../components/PermissionBadge.vue'
import RiskBadge from '../components/RiskBadge.vue'
import type { MarketplacePlugin } from '@/plugin-marketplace'

const route = useRoute()
const plugin = ref<MarketplacePlugin | null>(null)
const installed = ref(false)

function permRisk(_perm: string): 'low' | 'medium' | 'high' | 'critical' {
  return 'medium'
}

const overallRisk = computed(() => {
  const perms = plugin.value?.permissions || []
  if (perms.length >= 4) return 'critical' as const
  if (perms.length >= 2) return 'high' as const
  return 'low' as const
})

async function install() {
  if (!plugin.value) return
  await installedPluginService.install(plugin.value.id, plugin.value.name, plugin.value.version, plugin.value.permissions)
  installed.value = true
}

async function uninstall() {
  if (!plugin.value) return
  await installedPluginService.uninstall(plugin.value.id)
  installed.value = false
}

onMounted(async () => {
  const id = route.params.id as string
  plugin.value = await marketplaceService.getPlugin(id)
  installed.value = !!installedPluginService.getPlugin(id)
})
</script>

<style scoped>
.detail-page { padding: 24px; max-width: 800px; margin: 0 auto; }
.detail-empty { text-align: center; padding: 60px; color: #999; }
.back-btn { background: none; border: none; color: var(--accent, #5c6bc0); cursor: pointer; font-size: 14px; margin-bottom: 16px; padding: 0; }
.detail-header { display: flex; gap: 16px; align-items: center; margin-bottom: 16px; }
.detail-icon { width: 56px; height: 56px; border-radius: 12px; background: var(--accent, #5c6bc0); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 24px; font-weight: 700; }
.detail-header h1 { margin: 0; font-size: 22px; }
.detail-desc { color: #555; line-height: 1.6; }
.detail-meta { display: flex; gap: 20px; color: #777; font-size: 13px; margin: 12px 0; }
.detail-section { margin: 20px 0; }
.detail-section h3 { font-size: 15px; margin-bottom: 8px; }
.detail-perms { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
.detail-actions { display: flex; gap: 12px; margin-top: 24px; }
.btn { border: none; border-radius: 8px; cursor: pointer; font-weight: 600; padding: 10px 24px; }
.btn--primary { background: var(--accent, #5c6bc0); color: #fff; }
.btn--danger { background: #f44336; color: #fff; }
.btn--lg { font-size: 15px; }
</style>
