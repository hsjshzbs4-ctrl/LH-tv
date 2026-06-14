<!-- modules/search-unified/ui/views/SearchProfileView.vue — CE8-E -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { SearchIPCClient } from '../../ipc/client/SearchIPCClient'

const props = defineProps<{ client: SearchIPCClient }>()
const profile = ref<any>(null)

onMounted(async () => {
  const resp = await props.client.getProfile()
  if (!('code' in resp)) profile.value = resp.profile
})
</script>

<template>
  <div v-if="profile" class="profile-view">
    <h3>Search Profile</h3>
    <section>
      <h4>Favorite Providers</h4>
      <div class="tags">
        <span v-for="p in profile.favoriteProviders" :key="p" class="tag">{{ p }}</span>
      </div>
    </section>
    <section>
      <h4>Frequent Queries</h4>
      <div class="tags">
        <span v-for="q in profile.frequentQueries" :key="q" class="tag">{{ q }}</span>
      </div>
    </section>
    <section>
      <h4>Recent Activity</h4>
      <ul>
        <li v-for="r in profile.recentInteractions?.slice(0, 10)" :key="r">{{ r }}</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.profile-view { max-width: 600px; padding: 24px; }
section { margin-bottom: 20px; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tag { padding: 4px 12px; border-radius: 16px; background: var(--color-surface-hover); font-size: 13px; }
ul { padding-left: 20px; }
li { font-size: 13px; padding: 2px 0; color: var(--color-text-muted); }
</style>
