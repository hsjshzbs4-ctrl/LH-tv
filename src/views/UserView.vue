<!-- src/views/UserView.vue - 我的 -->
<template>
  <div class="user-page">
    <h1 class="page-title">👤 我的</h1>
    <div class="menu-grid">
      <div class="menu-card" @click="$router.push('/favorites')">
        <span class="menu-icon">❤️</span>
        <span class="menu-label">我的收藏</span>
        <span class="menu-count" v-if="favCount > 0">{{ favCount }} 部</span>
      </div>
      <div class="menu-card" @click="$router.push('/history')">
        <span class="menu-icon">🕐</span>
        <span class="menu-label">观看历史</span>
        <span class="menu-count" v-if="historyCount > 0">{{ historyCount }} 条</span>
      </div>
      <div class="menu-card" @click="$router.push('/library')">
        <span class="menu-icon">📥</span>
        <span class="menu-label">本地库</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const favCount = computed(() => userStore.favorites.length)
const historyCount = computed(() => userStore.history.length)
</script>

<style scoped>
.page-title { font-size: var(--text-2xl); font-weight: var(--weight-bold); margin-bottom: var(--space-xl); }
.menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
.menu-card { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 20px; background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; transition: all var(--duration-fast) var(--ease-out); }
.menu-card:hover { border-color: var(--color-accent); background: var(--color-bg-hover); transform: translateY(-2px); }
.menu-icon { font-size: 36px; }
.menu-label { font-size: var(--text-base); color: var(--color-text-primary); font-weight: var(--weight-medium); }
.menu-count { font-size: var(--text-xs); color: var(--color-text-tertiary); }
</style>
