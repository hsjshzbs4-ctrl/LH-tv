// modules/search-unified/ui/composables/useDebounce.ts — CE8-E
import { ref, watch, onUnmounted } from 'vue'

export function useDebounce<T>(source: () => T, delay = 150) {
  const debounced = ref(source())
  let timer: ReturnType<typeof setTimeout> | null = null

  const stop = watch(source, (val) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { debounced.value = val }, delay)
  })

  onUnmounted(() => { if (timer) clearTimeout(timer); stop() })
  return debounced
}
