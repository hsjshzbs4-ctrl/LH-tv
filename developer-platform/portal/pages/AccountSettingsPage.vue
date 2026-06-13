<!-- developer-platform/portal/pages/AccountSettingsPage.vue — P5.3 -->
<template>
  <div class="account" v-if="account">
    <h1>Account Settings</h1>
    <div class="profile">
      <div class="field"><label>Username</label><span>{{ account.username }}</span></div>
      <div class="field"><label>Email</label><span>{{ account.email }}</span></div>
      <div class="field"><label>Role</label><span class="role-badge">{{ account.role }}</span></div>
      <div class="field"><label>Verified</label><span>{{ account.verified ? '✅ Yes' : '❌ No' }}</span></div>
      <div class="field"><label>Plugins</label><span>{{ account.pluginCount }}</span></div>
      <div class="field"><label>Total Downloads</label><span>{{ account.totalDownloads.toLocaleString() }}</span></div>
    </div>
  </div>
  <div v-else class="empty"><p>No account configured.</p></div>
</template>

<script setup lang="ts">
import { developerAccountManager } from '../../accounts/DeveloperAccount'
const account = developerAccountManager.getAll()[0] || null
</script>

<style scoped>
.account{ padding:24px; max-width:600px; margin:0 auto; }
.profile{ margin-top:16px; }
.field{ display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid #eee; }
.field label{ font-weight:600; color:#777; font-size:13px; }
.role-badge{ background:var(--accent,#5c6bc0); color:#fff; padding:2px 10px; border-radius:12px; font-size:11px; }
.empty{ text-align:center; color:#999; padding:40px; }
</style>
