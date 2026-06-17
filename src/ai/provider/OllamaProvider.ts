// src/ai/provider/OllamaProvider.ts — Ollama Provider (Local)
// PB6: 通过 ModelGateway 调用，禁止直接使用

import { AICapability, type IAIProvider, type AIResponse, type AIContext, type AIModelConfig } from '../types/ai.types'

export class OllamaProvider implements IAIProvider {
  readonly name = 'ollama'
  readonly capabilities = [
    AICapability.ASK, AICapability.SUMMARIZE, AICapability.SUGGEST, AICapability.ASSIST,
  ]
  private config: AIModelConfig | null = null
  private available = false

  async initialize(config: AIModelConfig): Promise<void> {
    this.config = config
    // Ollama 本地运行，不需要 API Key
    this.available = true
  }

  async complete(prompt: string, context?: AIContext): Promise<AIResponse> {
    if (!this.available || !this.config) {
      return this.fallbackResponse()
    }

    const endpoint = this.config.endpoint ?? 'http://localhost:11434/api/generate'
    const model = this.config.model ?? 'llama3.2'

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            temperature: this.config.temperature ?? 0.7,
            num_predict: this.config.maxTokens ?? 1024,
          },
        }),
        signal: AbortSignal.timeout(this.config.timeout ?? 120000),
      })

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}. Is Ollama running?`)
      }

      const data = await response.json() as { response: string }

      return {
        text: data.response ?? 'No response',
        confidence: 0.8,
        capability: AICapability.ASK,
      }
    } catch (err) {
      return {
        text: `[Ollama Error] ${String(err)}. Please ensure Ollama is running locally.`,
        confidence: 0,
        capability: AICapability.ASK,
      }
    }
  }

  isAvailable(): boolean { return this.available }
  async dispose(): Promise<void> { this.available = false; this.config = null }

  private fallbackResponse(): AIResponse {
    return {
      text: '[Ollama] Provider not configured. Please check Ollama is installed and running.',
      confidence: 0,
      capability: AICapability.ASK,
    }
  }
}
