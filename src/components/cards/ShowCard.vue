<!-- src/components/cards/ShowCard.vue - 网格影视卡片（分类/搜索页用）-->
<template>
  <div class="show-card" @click="$emit('click')" :title="name">
    <div class="card-poster">
      <img
        v-if="image && !imgError"
        :src="image"
        :alt="name"
        class="card-image"
        loading="lazy"
        @error="imgError = true"
      />
      <div v-else class="fallback-poster" :style="{ background: bgColor }">
        {{ initial }}
      </div>
      <div class="card-overlay">
        <span class="card-play-btn">▶</span>
        <span class="card-rating-badge" v-if="rating">⭐{{ formatRating }}</span>
      </div>
    </div>
    <div class="card-info">
      <div class="card-title">{{ name }}</div>
      <div class="card-meta" v-if="year || remarks">
        <span v-if="year" class="year-tag">{{ year }}</span>
        <span v-if="remarks" class="remarks-text">{{ remarks }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  name: string
  image?: string
  rating?: number | string | null
  year?: number | string | null
  remarks?: string
}>(), {})

defineEmits<{ click: [] }>()

const imgError = ref(false)

const initial = computed(() => (props.name || '影').charAt(0))

const formatRating = computed(() => {
  if (props.rating == null) return ''
  return typeof props.rating === 'number' ? props.rating.toFixed(1) : String(props.rating)
})

const CARD_COLORS = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#1abc9c', '#e91e63']

const bgColor = computed(() => {
  let sum = 0
  for (let i = 0; i < props.name.length; i++) sum += props.name.charCodeAt(i)
  return CARD_COLORS[sum % CARD_COLORS.length]
})
</script>

<style scoped>
.show-card {
  cursor: pointer;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  transition: transform var(--duration-normal) var(--ease-out),
              box-shadow var(--duration-normal) var(--ease-out),
              border-color var(--duration-normal) var(--ease-out);
}

.show-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--color-border-hover);
}

.card-poster {
  position: relative;
  width: 100%;
  padding-top: 140%;
  overflow: hidden;
  background: var(--color-bg-surface);
}

.card-image {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform var(--duration-slow) var(--ease-out);
}

.show-card:hover .card-image {
  transform: scale(1.06);
}

.fallback-poster {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  font-weight: var(--weight-bold);
  color: rgba(255, 255, 255, 0.7);
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-out);
}

.show-card:hover .card-overlay {
  opacity: 1;
}

.card-play-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: var(--shadow-card);
  transition: transform var(--duration-fast) var(--ease-spring);
}

.show-card:hover .card-play-btn {
  transform: scale(1.1);
}

.card-rating-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  font-size: var(--text-xs);
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: var(--radius-xs);
  color: var(--color-gold);
}

.card-info {
  padding: 10px 12px 12px;
}

.card-title {
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.card-meta {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.year-tag {
  color: var(--color-text-secondary);
}

.remarks-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
