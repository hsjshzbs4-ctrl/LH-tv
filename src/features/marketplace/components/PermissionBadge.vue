<!-- P5.2: PermissionBadge.vue — 权限徽章组件 -->
<template>
  <span class="perm-badge" :class="`perm-badge--${risk}`" :aria-label="`${permission}: ${risk} risk`">
    {{ permission }}
  </span>
</template>

<script setup lang="ts">
defineProps<{
  permission: string
  risk?: 'low' | 'medium' | 'high' | 'critical'
}>()
</script>

<style scoped>
.perm-badge { display: inline-block; padding: 3px 10px; border-radius: 14px; font-size: 12px; font-weight: 500; margin: 2px; }
.perm-badge--low { background: #e8f5e9; color: #2e7d32; }
.perm-badge--medium { background: #fff3e0; color: #e65100; }
.perm-badge--high { background: #fce4ec; color: #c62828; }
.perm-badge--critical { background: #f44336; color: #fff; }
</style>
