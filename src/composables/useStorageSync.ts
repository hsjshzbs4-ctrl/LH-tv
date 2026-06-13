// src/composables/useStorageSync.ts - 用户数据初始化（v3 简化版）
// v3: userStore 直接使用 StorageService，此模块仅负责启动时触发加载
// 所有数据读写直接通过 userStore 方法，不再需要双向同步桥接
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

export function useStorageSync() {
  const userStore = useUserStore()

  // 启动时从 StorageService 加载
  onMounted(() => {
    userStore.loadFromStorage()
  })

  return {
    isLoaded: userStore.isLoaded,
    loadFromMain: userStore.loadFromStorage,
  }
}
