<!-- developer-platform/portal/pages/ReviewStatusPage.vue — P5.3 -->
<template>
  <div class="review"><h1>Review Status</h1>
    <nav class="tabs"><button v-for="t in tabs" :key="t" :class="{active:tab===t}" @click="tab=t">{{t}}</button></nav>
    <div v-if="filtered.length===0" class="empty">No submissions in "{{tab}}".</div>
    <div v-for="s in filtered" :key="s.id" class="row">
      <span><strong>{{ (s.manifest as any)?.name }}</strong> · {{ (s.manifest as any)?.version }}</span>
      <span class="badge" :class="'badge--'+s.state">{{ s.state }}</span>
      <button v-if="s.state==='SUBMITTED'" class="btn btn--xs btn--primary" @click="approve(s.id)">Approve</button>
      <button v-if="s.state!=='REJECTED'" class="btn btn--xs btn--danger" @click="reject(s.id)">Reject</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { pluginReviewService } from '../../review/PluginReviewService'
import { pluginSubmissionService } from '../../publishing/PluginSubmissionService'
import { pluginRegistry } from '../../repository-server/PluginRegistry'
import type { PluginSubmission } from '../../shared/types'

const tab = ref('SUBMITTED')
const tabs = ['SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED']
const all = ref<PluginSubmission[]>([])
const filtered = computed(()=>all.value.filter(s=>s.state===tab.value))

function approve(id:string){
  pluginReviewService.approve(id)
  const sub = pluginSubmissionService.getSubmission(id)
  if(sub){ pluginRegistry.register(sub); pluginSubmissionService.transition(id,'PUBLISHED') }
  onMounted(()=>{ all.value = pluginSubmissionService.getAll() })()
}
function reject(id:string){ pluginReviewService.reject(id,'Rejected'); pluginSubmissionService.transition(id,'REJECTED') }

const refresh = ()=>{ all.value = pluginSubmissionService.getAll() }
onMounted(refresh)
</script>

<style scoped>
.review{ padding:24px; max-width:1000px; margin:0 auto; }
.tabs{ display:flex; gap:8px; margin:16px 0; }
.tabs button{ padding:8px 16px; border:1px solid #ddd; border-radius:20px; background:#fff; cursor:pointer; font-size:13px; }
.tabs button.active{ background:var(--accent,#5c6bc0); color:#fff; border-color:var(--accent,#5c6bc0); }
.row{ display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #eee; gap:12px; }
.badge{ padding:2px 10px; border-radius:12px; font-size:11px; font-weight:600; }
.badge--SUBMITTED{ background:#e3f2fd; color:#1565c0; }
.badge--APPROVED,.badge--PUBLISHED{ background:#e8f5e9; color:#2e7d32; }
.badge--REJECTED{ background:#fce4ec; color:#c62828; }
.badge--UNDER_REVIEW{ background:#f3e5f5; color:#7b1fa2; }
.empty{ text-align:center; color:#999; padding:40px; }
.btn{ border:none; border-radius:4px; cursor:pointer; font-weight:600; }
.btn--xs{ font-size:11px; padding:4px 10px; }
.btn--primary{ background:var(--accent,#5c6bc0); color:#fff; }
.btn--danger{background:#f44336;color:#fff;}
</style>
