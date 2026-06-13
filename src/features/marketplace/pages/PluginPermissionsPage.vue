<!-- P5.2: PluginPermissionsPage.vue — 权限管理中心 -->
<template>
  <div class="perms-page">
    <h1>Plugin Permissions</h1>

    <div v-if="store.entries.length === 0" class="empty"><p>No plugins installed with permissions.</p></div>

    <table v-else class="perms-table">
      <thead>
        <tr><th>Plugin</th><th>Permissions</th><th>Risk</th><th>Actions</th></tr>
      </thead>
      <tbody>
        <tr v-for="entry in store.entries" :key="entry.pluginId">
          <td>{{ entry.pluginName }}</td>
          <td>
            <PermissionBadge v-for="p in entry.permissions" :key="p" :permission="p" :risk="entry.risk" />
            <span v-if="entry.permissions.length === 0" class="text-muted">None</span>
          </td>
          <td><RiskBadge :level="entry.risk" /></td>
          <td>
            <div class="action-row">
              <select v-model="selectedPerms[entry.pluginId]" class="perm-select">
                <option value="">Add permission...</option>
                <option v-for="ap in store.allPermissions" :key="ap" :value="ap">{{ ap }}</option>
              </select>
              <button class="btn btn--xs btn--primary" @click="onGrant(entry.pluginId)">Grant</button>
              <button class="btn btn--xs btn--outline" @click="onRevokeAll(entry.pluginId)">Revoke All</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePermissionsStore } from '../stores/permissions.store'
import PermissionBadge from '../components/PermissionBadge.vue'
import RiskBadge from '../components/RiskBadge.vue'
import { PluginPermission } from '@/plugin-marketplace'

const store = usePermissionsStore()
const selectedPerms = ref<Record<string, string>>({})

function onGrant(pluginId: string) {
  const perm = selectedPerms.value[pluginId]
  if (perm) store.grant(pluginId, perm as PluginPermission)
  selectedPerms.value[pluginId] = ''
}

function onRevokeAll(pluginId: string) {
  store.revoke(pluginId, 'PROVIDER_ACCESS' as PluginPermission)
  store.refresh()
}

onMounted(() => store.refresh())
</script>

<style scoped>
.perms-page { padding: 24px; max-width: 1100px; margin: 0 auto; }
.perms-page h1 { font-size: 24px; }
.perms-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
.perms-table th, .perms-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; font-size: 13px; }
.perms-table th { color: #777; font-weight: 600; }
.text-muted { color: #ccc; }
.action-row { display: flex; gap: 6px; align-items: center; }
.perm-select { padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 11px; }
.empty { text-align: center; padding: 40px; color: #999; }
.btn { border: none; border-radius: 4px; cursor: pointer; font-weight: 600; }
.btn--xs { font-size: 11px; padding: 4px 8px; }
.btn--primary { background: var(--accent, #5c6bc0); color: #fff; }
.btn--outline { background: #fff; color: var(--accent, #5c6bc0); border: 1px solid var(--accent, #5c6bc0); }
</style>
