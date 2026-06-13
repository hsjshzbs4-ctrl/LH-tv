// src/composables/useScroll.ts - 横向滚动控制
import { ref, type Ref } from 'vue'

export function useScroll() {
  const scrollContainer = ref<HTMLElement | null>(null)

  function scrollLeft(amount = 400) {
    if (scrollContainer.value) {
      scrollContainer.value.scrollBy({ left: -amount, behavior: 'smooth' })
    }
  }

  function scrollRight(amount = 400) {
    if (scrollContainer.value) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.value
      if (scrollLeft >= scrollWidth - clientWidth - 5) {
        return false // 已到底
      }
      scrollContainer.value.scrollBy({ left: amount, behavior: 'smooth' })
      return true
    }
    return false
  }

  const canScrollLeft = ref(false)
  const canScrollRight = ref(true)

  function updateArrows(el: Ref<HTMLElement | null>) {
    if (!el.value) return
    const { scrollLeft, scrollWidth, clientWidth } = el.value
    canScrollLeft.value = scrollLeft > 0
    canScrollRight.value = scrollLeft < scrollWidth - clientWidth - 5
  }

  return {
    scrollContainer,
    scrollLeft,
    scrollRight,
    canScrollLeft,
    canScrollRight,
    updateArrows
  }
}
