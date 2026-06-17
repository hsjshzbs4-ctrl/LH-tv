<!-- AISettingsView.vue — AI 设置页面 -->
<template>
  <div class="ai-settings">
    <h1>🤖 AI 设置</h1>
    <p class="subtitle">配置 AI Provider 和模型参数</p>

    <section class="setting-group">
      <h2>Provider</h2>
      <select v-model="provider" class="select">
        <option value="mock">Mock (默认)</option>
        <option value="openai">OpenAI</option>
        <option value="anthropic">Anthropic</option>
        <option value="ollama">Ollama (本地)</option>
      </select>
    </section>

    <section v-if="provider !== 'mock'" class="setting-group">
      <h2>API Key</h2>
      <input v-model="apiKey" type="password" placeholder="输入 API Key..." class="input" />
      <p class="hint">API Key 仅存储在本地，不会上传</p>
    </section>

    <section v-if="provider !== 'mock'" class="setting-group">
      <h2>模型</h2>
      <input v-model="model" type="text" placeholder="模型名称 (默认自动)" class="input" />
    </section>

    <section class="setting-group">
      <h2>参数</h2>
      <div class="param-row">
        <label>Temperature: {{ temperature }}</label>
        <input v-model.number="temperature" type="range" min="0" max="2" step="0.1" />
      </div>
      <div class="param-row">
        <label>Max Tokens: {{ maxTokens }}</label>
        <input v-model.number="maxTokens" type="range" min="256" max="4096" step="256" />
      </div>
    </section>

    <button class="save-btn" @click="save">保存配置</button>
    <p v-if="saved" class="saved-msg">✅ 配置已保存</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const provider = ref('mock')
const apiKey = ref('')
const model = ref('')
const temperature = ref(0.7)
const maxTokens = ref(1024)
const saved = ref(false)

function save() {
  // Phase 6 Bootstrap: 写入 storageService.settings
  saved.value = true
  setTimeout(() => saved.value = false, 2000)
}
</script>

<style scoped>
.ai-settings {
  max-width: 640px;
  margin: 0 auto;
  padding: 24px;
  color: var(--text-primary, #fff);
}
h1 { font-size: 24px; margin-bottom: 4px; }
.subtitle { color: #888; margin-bottom: 24px; }
.setting-group {
  background: var(--bg-secondary, #1e1e2e);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.setting-group h2 { font-size: 15px; margin-bottom: 12px; color: #aaa; }
.select, .input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border, #444);
  background: var(--bg-primary, #1a1a2e);
  color: var(--text-primary, #fff);
  font-size: 14px;
}
.hint { font-size: 12px; color: #666; margin-top: 6px; }
.param-row { margin-bottom: 12px; display: flex; flex-direction: column; gap: 4px; }
.param-row label { font-size: 13px; color: #aaa; }
.param-row input[type="range"] { width: 100%; }
.save-btn {
  padding: 12px 32px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
.saved-msg { margin-top: 12px; color: #4caf50; }
</style>
