<!-- P5.2: MarketplaceHomePage.vue — Marketplace 首页 -->
<template>
  <div class="marketplace-home">
    <header class="marketplace-home__header">
      <h1>Plugin Marketplace</h1>
      <input
        v-model="keyword"
        type="text"
        placeholder="Search plugins..."
        class="marketplace-home__search"
        @input="onSearch"
      />
    </header>

    <!-- Categories -->
    <nav class="marketplace-home__categories">
      <button v-for="cat in categories" :key="cat.id"
        class="category-btn" :class="{ 'category-btn--active': store.selectedCategory === cat.id }"
        @click="store.filterByCategory(cat.id)">
        {{ cat.label }}
      </button>
    </nav>

    <!-- Loading -->
    <div v-if="store.loading" class="loading-skeleton">
      <div v-for="i in 3" :key="i" class="skeleton-card" />
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="error-state">
      <p>{{ store.error }}</p>
      <button @click="store.loadPopular()">Retry</button>
    </div>

    <!-- Grid -->
    <PluginGrid v-else
      :plugins="store.plugins"
      :is-installed="(id: string) => installedIds.has(id)"
      @plugin-click="goDetail"
      @plugin-install="onInstall"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMarketplaceStore } from '../stores/marketplace.store'
import { installedPluginService } from '../services/InstalledPluginService'
import PluginGrid from '../components/PluginGrid.vue'
import type { MarketplacePlugin } from '@/plugin-marketplace'

const router = useRouter()
const store = useMarketplaceStore()
const keyword = ref('')
const installedIds = ref(new Set<string>())

const categories = [
  { id: 'all', label: 'All' },
  { id: 'providers', label: 'Providers' },
  { id: 'utilities', label: 'Utilities' },
  { id: 'developer', label: 'Developer' },
  { id: 'ui', label: 'UI' },
]

let searchTimer: ReturnType<typeof setTimeout>
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (keyword.value.trim()) store.search(keyword.value.trim())
    else store.loadPopular()
  }, 200)
}

function goDetail(plugin: MarketplacePlugin) {
  router.push({ name: 'marketplace-detail', params: { id: plugin.id } })
}

async function onInstall(plugin: MarketplacePlugin) {
  const result = await installedPluginService.install(plugin.id, plugin.name, plugin.version, plugin.permissions)
  if (result.success) {
    installedIds.value = new Set(installedPluginService.getAll().map(p => p.id))
  }
}

onMounted(async () => {
  await store.loadPopular()
  await store.loadFeatured()
  installedIds.value = new Set(installedPluginService.getAll().map(p => p.id))
})
</script>

<style scoped>
.marketplace-home { padding: 24px; max-width: 1200px; margin: 0 auto; }
.marketplace-home__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }
.marketplace-home__header h1 { font-size: 24px; font-weight: 700; margin: 0; }
.marketplace-home__search { padding: 10px 16px; border: 1px solid #d0d0d0; border-radius: 8px; font-size: 14px; width: 280px; outline: none; }
.marketplace-home__search:focus { border-color: var(--accent, #5c6bc0); }
.marketplace-home__categories { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
.category-btn { padding: 6px 16px; border: 1px solid #d0d0d0; border-radius: 20px; background: #fff; cursor: pointer; font-size: 13px; transition: all .15s; }
.category-btn--active, .category-btn:hover { background: var(--accent, #5c6bc0); color: #fff; border-color: var(--accent, #5c6bc0); }
.loading-skeleton { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 12px; }
.skeleton-card { height: 130px; background: #f0f0f0; border-radius: 10px; animation: pulse 1.5s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
.error-state { text-align: center; padding: 40px; color: #c62828; }
</style>
