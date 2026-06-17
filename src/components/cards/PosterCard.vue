<!-- src/components/cards/PosterCard.vue - 海报卡片（横向滚动行用）-->
<template>
  <div class="poster-card" @click="$emit('click')" :title="name">
    <div class="poster-img-wrapper">
      <img
        v-if="safeImage && !imgErrorRef"
        :src="safeImage"
        :alt="name"
        class="poster-img"
        loading="lazy"
        @error="imgErrorRef = true"
      />
      <div v-else class="poster-placeholder" :style="{ background: bgColor }">
        {{ initial }}
      </div>
      <div class="poster-hover-overlay">
        <span class="play-icon">▶</span>
      </div>
    </div>
    <div class="poster-title">{{ name }}</div>
    <div class="poster-meta" v-if="rating || remarks">
      <span v-if="rating" class="poster-rating">⭐{{ typeof rating === 'number' ? rating.toFixed(1) : rating }}</span>
      <span v-if="rating && remarks"> · </span>
      <span v-if="remarks">{{ remarks }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  name: string
  image?: string
  rating?: number | string | null
  remarks?: string
}>(), {})

defineEmits<{ click: [] }>()

const imgError = ref(false)

// HOTFIX-001: 校验封面 URL 有效性，减少误判
function isValidImageUrl(url: string | undefined): boolean {
  if (!url || url.trim() === '') return false
  // 过滤 Electron file:// 等不可用协议
  if (url.startsWith('file://') && url.includes('undefined')) return false
  return true
}

const safeImage = computed(() => {
  if (!props.image) return null
  return isValidImageUrl(props.image) ? props.image : null
})

const imgErrorRef = ref(false)

const initial = computed(() => {
  if (!props.name) return '影'
  // 取中文首字或英文首字母
  return props.name.trim().charAt(0)
})

const CARD_COLORS = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#1abc9c', '#e91e63']

const bgColor = computed(() => {
  let sum = 0
  for (let i = 0; i < props.name.length; i++) sum += props.name.charCodeAt(i)
  return CARD_COLORS[sum % CARD_COLORS.length]
})
</script>

<style scoped>
.poster-card {
  flex-shrink: 0;
  width: 160px;
  cursor: pointer;
  scroll-snap-align: start;
  transition: transform var(--duration-normal) var(--ease-out);
}

.poster-card:hover {
  transform: translateY(-6px);
}

.poster-img-wrapper {
  position: relative;
  width: 160px;
  height: 224px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-bg-surface);
}

.poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform var(--duration-slow) var(--ease-out);
}

.poster-card:hover .poster-img {
  transform: scale(1.08);
}

.poster-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: var(--weight-bold);
  color: #fff;
}

.poster-hover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-out);
}

.poster-card:hover .poster-hover-overlay {
  opacity: 1;
}

.play-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--color-accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  box-shadow: var(--shadow-card);
}

.poster-title {
  margin-top: 8px;
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.poster-meta {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.poster-rating {
  color: var(--color-gold);
}
</style>
