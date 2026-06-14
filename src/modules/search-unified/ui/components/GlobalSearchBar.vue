<!-- modules/search-unified/ui/components/GlobalSearchBar.vue — CE8-E -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useSearchStore } from '../stores/SearchStore'

const store = useSearchStore()
const inputRef = ref<HTMLInputElement | null>(null)
const focused = ref(false)

function onInput(e: Event) {
  store.query = (e.target as HTMLInputElement).value
  if (store.query.length >= 2) store.openOverlay()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') { store.closeOverlay(); inputRef.value?.blur() }
  else if (e.key === 'ArrowDown') { e.preventDefault(); store.moveSelection(1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); store.moveSelection(-1) }
  else if (e.key === 'Enter') { store.executeSearch(store.query) }
}

function onFocus() { focused.value = true; if (store.query) store.openOverlay() }
function onBlur() { setTimeout(() => focused.value = false, 200) }

// Ctrl+K global shortcut
function globalKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault(); inputRef.value?.focus()
  }
}

onMounted(() => document.addEventListener('keydown', globalKeydown))
onUnmounted(() => document.removeEventListener('keydown', globalKeydown))
</script>

<template>
  <div class="global-search-bar" :class="{ focused }">
    <span class="search-icon">🔍</span>
    <input
      ref="inputRef"
      type="text"
      :value="store.query"
      placeholder="Search movies, TV shows, anime..."
      aria-label="Search content"
      role="combobox"
      aria-expanded="store.overlayState !== 'closed'"
      @input="onInput"
      @keydown="onKeydown"
      @focus="onFocus"
      @blur="onBlur"
    />
    <kbd class="shortcut-hint">Ctrl+K</kbd>
  </div>
</template>

<style scoped>
.global-search-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; border-radius: 8px;
  background: var(--color-surface); border: 1px solid var(--color-border);
  transition: border-color 0.2s;
}
.global-search-bar.focused { border-color: var(--color-primary); }
.search-icon { font-size: 16px; opacity: 0.6; }
input {
  flex: 1; border: none; outline: none; background: transparent;
  font-size: 14px; color: var(--color-text);
}
input::placeholder { color: var(--color-text-muted); }
.shortcut-hint {
  padding: 2px 6px; font-size: 11px; border-radius: 4px;
  background: var(--color-surface-hover); color: var(--color-text-muted);
}
</style>
