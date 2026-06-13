<!-- developer-platform/portal/pages/DeveloperDashboard.vue — P5.3 -->
<template>
  <div class="dash">
    <h1>Developer Dashboard</h1>
    <div class="dash-grid">
      <div class="dash-card"><span class="dash-num">{{ submissions.length }}</span><span>Submissions</span></div>
      <div class="dash-card"><span class="dash-num">{{ approved }}</span><span>Approved</span></div>
      <div class="dash-card"><span class="dash-num">{{ totalDownloads }}</span><span>Downloads</span></div>
      <div class="dash-card"><span class="dash-num dash-num--warn">{{ pending }}</span><span>Pending Review</span></div>
    </div>
    <section><h3>Recent Submissions</h3>
      <div v-if="submissions.length===0" class="empty">No submissions yet.</div>
      <div v-for="s in submissions.slice(0,5)" :key="s.id" class="sub-item">
        <span>{{ (s.manifest as any)?.name || 'Untitled' }}</span>
        <span class="badge" :class="'badge--'+s.state">{{ s.state }}</span>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { pluginSubmissionService } from '../../publishing/PluginSubmissionService'
import { pluginAnalyticsService } from '../../analytics/PluginAnalyticsService'
import type { PluginSubmission } from '../../shared/types'

const submissions = ref<PluginSubmission[]>([])
const pending = computed(()=>submissions.value.filter(s=>['SUBMITTED','SCANNING','UNDER_REVIEW'].includes(s.state)).length)
const approved = computed(()=>submissions.value.filter(s=>s.state==='APPROVED'||s.state==='PUBLISHED').length)
const totalDownloads = computed(()=>submissions.value.reduce((sum,s)=>sum+((pluginAnalyticsService.get((s.manifest as any)?.id||'')?.downloads||0)),0))

onMounted(()=>{ submissions.value = pluginSubmissionService.getAll() })
</script>

<style scoped>
.dash{ padding:24px; max-width:1000px; margin:0 auto; }
.dash h1{ font-size:24px; }
.dash-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:12px; margin:20px 0; }
.dash-card{ background:#f9f9f9; padding:20px; border-radius:10px; display:flex; flex-direction:column; align-items:center; gap:6px; }
.dash-num{ font-size:32px; font-weight:700; color:var(--accent,#5c6bc0); }
.dash-num--warn{ color:#e65100; }
.empty{ text-align:center; color:#999; padding:20px; }
.sub-item{ display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee; }
.badge{ padding:2px 10px; border-radius:12px; font-size:11px; font-weight:600; }
.badge--SUBMITTED,.badge--SCANNING{ background:#e3f2fd; color:#1565c0; }
.badge--APPROVED,.badge--PUBLISHED{ background:#e8f5e9; color:#2e7d32; }
.badge--REJECTED{ background:#fce4ec; color:#c62828; }
.badge--UNDER_REVIEW{ background:#fff3e0; color:#e65100; }
</style>
