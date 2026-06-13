<!-- developer-platform/portal/pages/PublishPluginPage.vue — P5.3 -->
<template>
  <div class="publish" v-if="account">
    <h1>Publish Plugin</h1>
    <form @submit.prevent="submit" class="publish-form">
      <label>Plugin ID <input v-model="form.id" required /></label>
      <label>Name <input v-model="form.name" required /></label>
      <label>Version <input v-model="form.version" value="1.0.0" required /></label>
      <label>Description <textarea v-model="form.description" rows="3" /></label>
      <label>SDK Version <input v-model="form.sdkVersion" value="1.0.0" required /></label>
      <label>Entry <input v-model="form.entry" value="main.js" required /></label>
      <label>Permissions <input v-model="form.permissionsStr" placeholder="comma separated" /></label>
      <button type="submit" class="btn btn--primary btn--lg" :disabled="submitting">
        {{ submitting ? 'Submitting...' : 'Submit for Review' }}
      </button>
    </form>
    <div v-if="result" class="result" :class="result.success?'result--ok':'result--err'">
      {{ result.success ? `Submitted! ID: ${result.submissionId}` : result.error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { developerAccountManager } from '../../accounts/DeveloperAccount'
import { pluginSubmissionService } from '../../publishing/PluginSubmissionService'

const account = developerAccountManager.getAll()[0] || null
const form = reactive({ id:'', name:'', version:'1.0.0', description:'', sdkVersion:'1.0.0', entry:'main.js', permissionsStr:'' })
const submitting = ref(false)
const result = ref<{success:boolean;submissionId?:string;error?:string}|null>(null)

async function submit(){
  submitting.value = true
  const permissions = form.permissionsStr.split(',').map(s=>s.trim()).filter(Boolean)
  result.value = pluginSubmissionService.submit(account?.id||'', {
    id:form.id, name:form.name, version:form.version, description:form.description, sdkVersion:form.sdkVersion, entry:form.entry, permissions
  })
  submitting.value = false
}
</script>

<style scoped>
.publish{ padding:24px; max-width:700px; margin:0 auto; }
.publish-form{ display:flex; flex-direction:column; gap:14px; margin:20px 0; }
.publish-form label{ display:flex; flex-direction:column; gap:4px; font-size:13px; font-weight:600; color:#555; }
.publish-form input,.publish-form textarea{ padding:10px; border:1px solid #d0d0d0; border-radius:6px; font-size:14px; outline:none; }
.publish-form input:focus,.publish-form textarea:focus{ border-color:var(--accent,#5c6bc0); }
.btn{border:none;border-radius:8px;cursor:pointer;font-weight:600;padding:12px 24px;}
.btn--primary{background:var(--accent,#5c6bc0);color:#fff;}
.btn--lg{font-size:15px;}
.result{margin-top:16px;padding:14px;border-radius:8px;font-size:14px;}
.result--ok{background:#e8f5e9;color:#2e7d32;}
.result--err{background:#fce4ec;color:#c62828;}
</style>
