// src/features/marketplace/routes/index.ts — P5.2 Marketplace Routes
export const marketplaceRoutes = [
  {
    path: '/marketplace',
    name: 'marketplace',
    component: () => import('../pages/MarketplaceHomePage.vue'),
    meta: { title: 'Plugin Marketplace', sidebar: true },
  },
  {
    path: '/marketplace/plugin/:id',
    name: 'marketplace-detail',
    component: () => import('../pages/MarketplaceDetailPage.vue'),
    meta: { title: 'Plugin Detail' },
  },
  {
    path: '/plugins/installed',
    name: 'installed-plugins',
    component: () => import('../pages/InstalledPluginsPage.vue'),
    meta: { title: 'Installed Plugins', sidebar: true },
  },
  {
    path: '/plugins/updates',
    name: 'plugin-updates',
    component: () => import('../pages/PluginUpdatesPage.vue'),
    meta: { title: 'Plugin Updates', sidebar: true },
  },
  {
    path: '/plugins/permissions',
    name: 'plugin-permissions',
    component: () => import('../pages/PluginPermissionsPage.vue'),
    meta: { title: 'Plugin Permissions', sidebar: true },
  },
  {
    path: '/plugins/developer',
    name: 'developer-tools',
    component: () => import('../pages/DeveloperToolsPage.vue'),
    meta: { title: 'Developer Tools' },
  },
]
