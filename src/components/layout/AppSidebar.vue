<!-- src/components/layout/AppSidebar.vue - 侧边导航栏 -->
<template>
  <nav
    class="sidebar"
    :class="{ collapsed: appStore.sidebarCollapsed && !appStore.sidebarHovered }"
    @mouseenter="appStore.sidebarHovered = true"
    @mouseleave="appStore.sidebarHovered = false"
  >
    <div class="sidebar-nav">
      <!-- 首页 -->
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="sidebar-item"
        :class="{ active: isActive(item.path) }"
        :title="appStore.sidebarCollapsed ? item.label : ''"
      >
        <span class="sidebar-icon">{{ item.icon }}</span>
        <span class="sidebar-label">{{ item.label }}</span>
        <span class="sidebar-indicator" v-if="isActive(item.path)"></span>
      </router-link>

      <div class="sidebar-divider" />
      <div class="sidebar-section-label">影视分类</div>

      <!-- 影视分类 -->
      <router-link
        v-for="item in videoCategories"
        :key="item.path"
        :to="item.path"
        class="sidebar-item"
        :class="{ active: isActive(item.path) }"
        :title="appStore.sidebarCollapsed ? item.label : ''"
      >
        <span class="sidebar-icon">{{ item.icon }}</span>
        <span class="sidebar-label">{{ item.label }}</span>
        <span class="sidebar-indicator" v-if="isActive(item.path)"></span>
      </router-link>

      <div class="sidebar-divider" />

      <!-- 工具 -->
      <router-link
        v-for="item in toolItems"
        :key="item.path"
        :to="item.path"
        class="sidebar-item"
        :class="{ active: isActive(item.path) }"
        :title="appStore.sidebarCollapsed ? item.label : ''"
      >
        <span class="sidebar-icon">{{ item.icon }}</span>
        <span class="sidebar-label">{{ item.label }}</span>
        <span class="sidebar-indicator" v-if="isActive(item.path)"></span>
      </router-link>
    </div>

    <div class="sidebar-bottom">
      <button class="sidebar-item collapse-btn" @click="appStore.toggleSidebar()" title="折叠侧边栏">
        <span class="sidebar-icon">{{ appStore.sidebarCollapsed ? '▶' : '◀' }}</span>
        <span class="sidebar-label">折叠</span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const appStore = useAppStore()

interface NavItem {
  path: string
  label: string
  icon: string
}

const navItems: NavItem[] = [
  { path: '/', label: '首页', icon: '🏠' },
]

// 影视分类
const videoCategories: NavItem[] = [
  { path: '/anime', label: '动漫', icon: '🎌' },
  { path: '/tv', label: '电视剧', icon: '📺' },
  { path: '/movies', label: '电影', icon: '🎬' },
]

const toolItems: NavItem[] = [
  { path: '/search', label: '搜索', icon: '🔍' },
  { path: '/downloads', label: '下载管理', icon: '⬇️' },
  { path: '/library', label: '本地库', icon: '📥' },
  { path: '/favorites', label: '收藏', icon: '❤️' },
  { path: '/history', label: '历史', icon: '🕐' },
  { path: '/marketplace', label: '插件市场', icon: '🧩' },
  { path: '/developer', label: '开发者', icon: '🛠️' },
  { path: '/settings', label: '设置', icon: '⚙️' },
]

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: var(--titlebar-height);
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: var(--color-bg-elevated);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  z-index: var(--z-sidebar);
  transition: width var(--duration-normal) var(--ease-in-out);
  overflow: hidden;
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed);
}

.sidebar-nav {
  flex: 1;
  padding: var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 10px 12px;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  transition: all var(--duration-fast) var(--ease-out);
  position: relative;
  white-space: nowrap;
}

.sidebar-item:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.sidebar-item.active {
  background: var(--color-accent-muted);
  color: var(--color-accent);
}

.sidebar-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--color-accent);
  border-radius: 0 2px 2px 0;
}

.sidebar-icon {
  font-size: 18px;
  flex-shrink: 0;
  width: 24px;
  text-align: center;
  line-height: 1;
}

.sidebar-label {
  overflow: hidden;
}

.collapsed .sidebar-label {
  opacity: 0;
  width: 0;
}

.sidebar-divider {
  height: 1px;
  background: var(--color-border);
  margin: 4px 8px;
}

.sidebar-section-label {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  padding: 4px 12px 2px;
  text-transform: uppercase;
  letter-spacing: 1px;
  white-space: nowrap;
}

.collapsed .sidebar-section-label {
  display: none;
}

.collapsed .sidebar-divider {
  margin: 2px 4px;
}

.sidebar-bottom {
  padding: var(--space-sm);
  border-top: 1px solid var(--color-border);
}

.collapse-btn {
  width: 100%;
}

.collapse-btn .sidebar-icon {
  font-size: 12px;
}
</style>
