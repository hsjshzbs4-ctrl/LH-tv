<!-- AIAssistantButton.vue — 全局 AI 浮动按钮 -->
<template>
  <div class="ai-fab" @click="$emit('toggle')" :title="isOpen ? '关闭 AI' : '打开 AI'">
    <span class="ai-fab-icon">🤖</span>
    <span v-if="!isOpen" class="ai-fab-label">AI</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ isOpen: boolean }>()
defineEmits<{ toggle: [] }>()
</script>

<style scoped>
.ai-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border-radius: 28px;
  padding: 12px 20px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  display: flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.2s;
  user-select: none;
}
.ai-fab:hover { transform: scale(1.05); }
.ai-fab-icon { font-size: 20px; }
.ai-fab-label { font-size: 14px; font-weight: 600; }
</style>
