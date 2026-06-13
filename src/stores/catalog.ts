// src/stores/catalog.ts - 影视目录缓存（v3: CacheManager 集成）
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CatalogItem, CatalogMap } from '@/types'
import { getSearchIndex } from '@/composables/useSearchIndex'
import { cacheManager, CacheNamespace } from '@/core/cache'

export const useCatalogStore = defineStore('catalog', () => {
  const allItems = ref<CatalogItem[]>([])
  const lastFetched = ref(0)
  const CACHE_TTL = 3 * 60 * 60 * 1000 // 3小时
  const indexBuilt = ref(false)

  const isStale = computed(() => Date.now() - lastFetched.value > CACHE_TTL)

  /** 将 CatalogMap 展平为 CatalogItem[]，并补齐 type 字段 */
  function flattenCatalogMap(catalog: CatalogMap): CatalogItem[] {
    const result: CatalogItem[] = []
    const types = Object.keys(catalog) as Array<keyof CatalogMap>
    for (const type of types) {
      const subMap = catalog[type]
      if (!subMap || typeof subMap !== 'object') continue
      const subs = Object.keys(subMap)
      for (const sub of subs) {
        const items = subMap[sub]
        if (Array.isArray(items)) {
          for (const item of items) {
            result.push({ ...item, type: item.type || type, sub })
          }
        }
      }
    }
    return result
  }

  async function loadFullCatalog() {
    if (allItems.value.length > 0 && !isStale.value) return allItems.value

    try {
      const catalog = await cacheManager.cacheWrap(
        CacheNamespace.CATALOG,
        'full-catalog',
        () => window.app.getFullCatalog()
      )
      allItems.value = flattenCatalogMap(catalog)
      lastFetched.value = Date.now()

      // 构建搜索索引
      if (allItems.value.length > 0) {
        const idx = getSearchIndex()
        idx.build(allItems.value)
        indexBuilt.value = true
        console.log('[索引] 已构建，' + idx.size + ' 条')
      }

      return allItems.value
    } catch {
      return allItems.value
    }
  }

  async function searchLocal(keyword: string): Promise<CatalogItem[]> {
    if (allItems.value.length === 0 || isStale.value) {
      await loadFullCatalog()
    }

    const q = keyword.trim()
    if (!q) return []

    // 使用索引搜索（Trie + 拼音），比线性扫描快 10-50x
    if (indexBuilt.value) {
      const idx = getSearchIndex()
      return idx.search(q, 10)
    }

    // 回退到线性搜索
    const lower = q.toLowerCase()
    return allItems.value
      .filter(item => (item.name || '').toLowerCase().includes(lower))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 10)
  }

  function clear() {
    allItems.value = []
    lastFetched.value = 0
    indexBuilt.value = false
    getSearchIndex().clear()
  }

  return {
    allItems,
    lastFetched,
    isStale,
    loadFullCatalog,
    searchLocal,
    clear
  }
})
