// src/router/index.ts - Vue Router 配置
import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router'
import { marketplaceRoutes } from '@/features/marketplace/routes'
import { developerPortalRoutes } from '@developer-platform/routes'
import { aiRoutes } from '@/ai/aiRoutes'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/renderer/pages/HomePage.vue'),
    meta: { title: '首页', icon: '🏠', keepAlive: true }
  },
  {
    path: '/tv',
    name: 'tv',
    component: () => import('@/renderer/pages/CategoryPage.vue'),
    meta: { title: '电视剧', icon: '📺', keepAlive: true, category: 'tv' as const }
  },
  {
    path: '/movies',
    name: 'movies',
    component: () => import('@/renderer/pages/CategoryPage.vue'),
    meta: { title: '电影', icon: '🎬', keepAlive: true, category: 'movie' as const }
  },
  {
    path: '/anime',
    name: 'anime',
    component: () => import('@/renderer/pages/CategoryPage.vue'),
    meta: { title: '动漫', icon: '🎌', keepAlive: true, category: 'anime' as const }
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('@/renderer/pages/SearchPage.vue'),
    meta: { title: '搜索', icon: '🔍' }
  },
  {
    path: '/detail',
    name: 'detail',
    component: () => import('@/renderer/pages/DetailPage.vue'),
    meta: { title: '详情', icon: '📋' }
  },
  {
    path: '/category/:type',
    name: 'category',
    component: () => import('@/renderer/pages/CategoryPage.vue'),
    meta: { title: '分类', icon: '📂' }
  },
  {
    path: '/play',
    name: 'play',
    component: () => import('@/views/PlayView.vue'),
    meta: { title: '播放', icon: '▶️' }
  },
  {
    path: '/player/:providerId/:mediaId/:episodeId',
    name: 'player',
    component: () => import('@/renderer/pages/PlayerPage.vue'),
    meta: { title: '播放', icon: '▶️' }
  },
  {
    path: '/downloads',
    name: 'downloads',
    component: () => import('@/views/DownloadView.vue'),
    meta: { title: '下载管理', icon: '⬇️' }
  },
  {
    path: '/library',
    name: 'library',
    component: () => import('@/views/LibraryView.vue'),
    meta: { title: '本地库', icon: '📥' }
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: () => import('@/renderer/pages/FavoritesPage.vue'),
    meta: { title: '收藏', icon: '❤️' }
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('@/renderer/pages/HistoryPage.vue'),
    meta: { title: '历史', icon: '🕐' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { title: '设置', icon: '⚙️' }
  },
  {
    path: '/user',
    name: 'user',
    component: () => import('@/views/UserView.vue'),
    meta: { title: '我的', icon: '👤' }
  },
  // P5.2 Marketplace Routes
  ...marketplaceRoutes,

  // P5.3 Developer Portal Routes
  ...developerPortalRoutes,

  // PB6 AI Routes
  ...aiRoutes,

  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createMemoryHistory(),
  routes
})

// 全局标题更新
router.afterEach((to) => {
  const title = to.meta.title as string
  document.title = title ? `LH - ${title}` : 'LH 影视'
})

export default router
