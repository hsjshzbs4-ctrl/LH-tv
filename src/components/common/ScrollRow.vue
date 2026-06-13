<!-- src/components/common/ScrollRow.vue - 横向滚动行 -->
<template>
  <section class="scroll-row">
    <div class="scroll-row-header">
      <h2 class="scroll-row-title">{{ title }}</h2>
      <button v-if="moreLink" class="scroll-row-more" @click="$router.push(moreLink)">
        查看更多 →
      </button>
    </div>

    <div class="scroll-wrapper">
      <button
        v-if="showArrows"
        class="scroll-arrow scroll-left"
        :class="{ hidden: !canScrollLeft }"
        @click="scrollLeft()"
      >‹</button>

      <div
        ref="scrollRef"
        class="scroll-row-items"
        @scroll="onScroll"
      >
        <slot />
      </div>

      <button
        v-if="showArrows"
        class="scroll-arrow scroll-right"
        :class="{ hidden: !canScrollRight }"
        @click="scrollRight()"
      >›</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

withDefaults(defineProps<{
  title: string
  moreLink?: string
  showArrows?: boolean
}>(), {
  showArrows: true
})

const scrollRef = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(true)

function scrollLeft() {
  if (scrollRef.value) {
    scrollRef.value.scrollBy({ left: -680, behavior: 'smooth' })
  }
}

function scrollRight() {
  if (scrollRef.value) {
    scrollRef.value.scrollBy({ left: 680, behavior: 'smooth' })
  }
}

function onScroll() {
  if (!scrollRef.value) return
  const { scrollLeft, scrollWidth, clientWidth } = scrollRef.value
  canScrollLeft.value = scrollLeft > 5
  canScrollRight.value = scrollLeft < scrollWidth - clientWidth - 5
}
</script>

<style scoped>
.scroll-row {
  margin: var(--space-xl) 0;
}

.scroll-row-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--space-md);
}

.scroll-row-title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
}

.scroll-row-more {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  transition: color var(--duration-fast) var(--ease-out);
}

.scroll-row-more:hover {
  color: var(--color-accent);
}

.scroll-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.scroll-row-items {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  flex: 1;
}

.scroll-row-items::-webkit-scrollbar {
  display: none;
}

.scroll-arrow {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: rgba(0, 0, 0, 0.7);
  color: var(--color-text-secondary);
  font-size: 22px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-fast) var(--ease-out);
  z-index: 10;
  line-height: 1;
}

.scroll-arrow:hover {
  background: var(--color-accent);
  color: #fff;
  border-color: var(--color-accent);
}

.scroll-arrow.hidden {
  opacity: 0;
  pointer-events: none;
}

.scroll-left { margin-right: 4px; }
.scroll-right { margin-left: 4px; }
</style>
