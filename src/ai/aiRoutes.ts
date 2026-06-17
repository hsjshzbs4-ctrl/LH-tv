// src/ai/aiRoutes.ts — PB6 AI 路由定义

import type { RouteRecordRaw } from 'vue-router'

export const aiRoutes: RouteRecordRaw[] = [
  {
    path: '/ai/settings',
    name: 'ai-settings',
    component: () => import('./views/AISettingsView.vue'),
    meta: { title: 'AI 设置', icon: '🤖' },
  },
]
