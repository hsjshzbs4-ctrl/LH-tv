// developer-platform/routes/index.ts — P5.4 Developer Portal Routes
export const developerPortalRoutes = [
  {
    path: '/developer',
    name: 'developer-dashboard',
    component: () => import('../portal/pages/DeveloperDashboard.vue'),
    meta: { title: 'Developer Dashboard', sidebar: true },
  },
  {
    path: '/developer/publish',
    name: 'developer-publish',
    component: () => import('../portal/pages/PublishPluginPage.vue'),
    meta: { title: 'Publish Plugin' },
  },
  {
    path: '/developer/plugins',
    name: 'developer-my-plugins',
    component: () => import('../portal/pages/MyPluginsPage.vue'),
    meta: { title: 'My Plugins', sidebar: true },
  },
  {
    path: '/developer/analytics',
    name: 'developer-analytics',
    component: () => import('../portal/pages/AnalyticsPage.vue'),
    meta: { title: 'Plugin Analytics' },
  },
  {
    path: '/developer/review',
    name: 'developer-review',
    component: () => import('../portal/pages/ReviewStatusPage.vue'),
    meta: { title: 'Review Status' },
  },
  {
    path: '/developer/account',
    name: 'developer-account',
    component: () => import('../portal/pages/AccountSettingsPage.vue'),
    meta: { title: 'Account Settings' },
  },
]
