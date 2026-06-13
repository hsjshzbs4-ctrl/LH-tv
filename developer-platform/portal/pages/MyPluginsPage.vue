<!-- developer-platform/portal/pages/MyPluginsPage.vue — P5.3 -->
<template>
  <div class="my-plugins">
    <h1>My Plugins</h1>
    <div v-if="subs.length===0" class="empty">No plugins submitted yet.</div>
    <div v-for="s in subs" :key="s.id" class="plugin-row">
      <div><strong>{{ (s.manifest as any)?.name || 'Untitled' }}</strong>
        <span class="text-muted">v{{ (s.manifest as any)?.version }}</span>
      </div>
      <span class="badge" :class="'badge--'+s.state">{{ s.state }}</span>
      <span class="text-muted">{{ new Date(s.submittedAt).toLocaleDateString() }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { pluginSubmissionService } from '../../publishing/PluginSubmissionService'
import { developerAccountManager } from '../../accounts/DeveloperAccount'
import type { PluginSubmission } from '../../shared/types'

const subs = ref<PluginSubmission[]>([])
onMounted(()=>{
  const acc = developerAccountManager.getAll()[0]
  subs.value = acc ? pluginSubmissionService.getByDeveloper(acc.id) : pluginSubmissionService.getAll()
})
</script>

<style scoped>
.my-plugins{ padding:24px; max-width:900px; margin:0 auto; }
.empty{ color:#999; text-align:center; padding:40px; }
.plugin-row{ display:flex; justify-content:space-between; align-items:center; padding:14px; border:1px solid #eee; border-radius:8px; margin:8px 0; }
.badge{ padding:2px 10px; border-radius:12px; font-size:11px; font-weight:600; }
.badge--SUBMITTED{ background:#e3f2fd; color:#1565c0; }
.badge--APPROVED,.badge--PUBLISHED{ background:#e8f5e9; color:#2e7d32; }
.badge--REJECTED{ background:#fce4ec; color:#c62828; }
.badge--CHANGES_REQUESTED{ background:#fff3e0; color:#e65100; }
.badge--UNDER_REVIEW{ background:#f3e5f5; color:#7b1fa2; }
.text-muted{ color:#999; font-size:12px; }
</style>
