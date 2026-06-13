<!-- src/views/FavoritesView.vue - 收藏 -->
<template>
  <div class="favorites-page">
    <h1 class="page-title">❤️ 我的收藏</h1>
    <div class="show-grid" v-if="userStore.favorites.length > 0">
      <ShowCard
        v-for="f in userStore.favorites"
        :key="f.id"
        :name="f.name"
        :image="f.image"
        :rating="f.rating"
        @click="$router.push({ path: '/play', query: { name: f.name } })"
      />
    </div>
    <EmptyState v-else message="还没有收藏任何内容" icon="❤️" action-label="去首页看看" @action="$router.push('/')" />
  </div>
</template>

<script setup lang="ts">
import ShowCard from '@/components/cards/ShowCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>

<style scoped>
.page-title { font-size: var(--text-2xl); font-weight: var(--weight-bold); margin-bottom: var(--space-xl); }
.show-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 20px; }
</style>
