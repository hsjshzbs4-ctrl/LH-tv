<!-- AIChatPanel.vue — 浮动 AI 聊天面板 -->
<template>
  <div v-if="visible" class="ai-panel">
    <div class="ai-panel-header">
      <span>🤖 AI 助手</span>
      <button class="ai-close" @click="$emit('close')">×</button>
    </div>
    <div class="ai-panel-messages" ref="msgContainer">
      <div v-if="messages.length === 0" class="ai-empty">
        问我关于正在看的剧集、推荐内容或播放控制
      </div>
      <div v-for="(msg, i) in messages" :key="i" :class="['ai-msg', msg.role]">
        {{ msg.content }}
      </div>
      <div v-if="loading" class="ai-msg assistant ai-loading">思考中...</div>
    </div>
    <div class="ai-panel-input">
      <input
        v-model="input"
        @keyup.enter="send"
        placeholder="输入消息..."
        :disabled="loading"
      />
      <button @click="send" :disabled="loading || !input.trim()">发送</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

defineProps<{ visible: boolean }>()
defineEmits<{ close: [] }>()

const input = ref('')
const loading = ref(false)
const messages = ref<Array<{ role: string; content: string }>>([])
const msgContainer = ref<HTMLElement>()

function send() {
  if (!input.value.trim() || loading.value) return
  messages.value.push({ role: 'user', content: input.value })
  input.value = ''
  loading.value = true

  // Mock response — Phase 6 Bootstrap wires real AIOrchestrator
  setTimeout(() => {
    messages.value.push({
      role: 'assistant',
      content: '[PB6] AI 助手正在启动中。请在设置中配置 AI Provider 后使用完整功能。',
    })
    loading.value = false
    nextTick(() => {
      if (msgContainer.value) {
        msgContainer.value.scrollTop = msgContainer.value.scrollHeight
      }
    })
  }, 500)
}

watch(() => messages.value.length, () => {
  nextTick(() => {
    if (msgContainer.value) {
      msgContainer.value.scrollTop = msgContainer.value.scrollHeight
    }
  })
})
</script>

<style scoped>
.ai-panel {
  position: fixed;
  bottom: 80px;
  right: 24px;
  width: 380px;
  height: 520px;
  background: var(--bg-primary, #1a1a2e);
  border: 1px solid var(--border, #333);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  z-index: 999;
}
.ai-panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--border, #333);
  display: flex;
  justify-content: space-between;
  font-weight: 600;
}
.ai-close {
  background: none; border: none; color: #888; font-size: 20px; cursor: pointer;
}
.ai-panel-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ai-empty {
  color: #666; text-align: center; margin-top: 40px; font-size: 14px;
}
.ai-msg {
  padding: 8px 12px;
  border-radius: 12px;
  max-width: 85%;
  font-size: 14px;
  line-height: 1.5;
}
.ai-msg.user {
  align-self: flex-end;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
}
.ai-msg.assistant {
  align-self: flex-start;
  background: var(--bg-secondary, #2a2a3a);
  color: var(--text-primary, #ddd);
}
.ai-loading { opacity: 0.6; }
.ai-panel-input {
  padding: 12px;
  border-top: 1px solid var(--border, #333);
  display: flex;
  gap: 8px;
}
.ai-panel-input input {
  flex: 1;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border, #444);
  background: var(--bg-secondary, #2a2a3a);
  color: var(--text-primary, #fff);
  font-size: 14px;
}
.ai-panel-input button {
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  cursor: pointer;
  font-weight: 600;
}
.ai-panel-input button:disabled { opacity: 0.5; cursor: default; }
</style>
