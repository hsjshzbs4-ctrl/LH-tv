// src/ai/provider/AnthropicProvider.ts — Anthropic Provider
// PB6: 通过 ModelGateway 调用，禁止直接使用

import { AICapability, type IAIProvider, type AIResponse, type AIContext, type AIModelConfig } from '../types/ai.types'

export class AnthropicProvider implements IAIProvider {
  readonly name = 'anthropic'
  readonly capabilities = [
    AICapability.ASK, AICapability.SUMMARIZE, AICapability.SUGGEST, AICapability.ASSIST,
  ]
  private config: AIModelConfig | null = null
  private available = false

  async initialize(config: AIModelConfig): Promise<void> {
    this.config = config
    if (config.apiKey) {
      this.available = true
    }
  }

  async complete(prompt: string, context?: AIContext): Promise<AIResponse> {
    if (!this.available || !this.config) {
      return this.fallbackResponse()
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model ?? 'claude-sonnet-4-6',
          max_tokens: this.config.maxTokens ?? 1024,
          messages: [{ role: 'user', content: prompt }],
          system: 'You are a helpful media assistant for LH-TV.',
        }),
        signal: AbortSignal.timeout(this.config.timeout ?? 60000),
      })

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`)
      }

      const data = await response.json() as {
        content: Array<{ type: string; text: string }>
      }

      return {
        text: data.content?.[0]?.text ?? 'No response',
        confidence: 0.9,
        capability: AICapability.ASK,
      }
    } catch (err) {
      return {
        text: `[Anthropic Error] ${String(err)}. Please check your API key.`,
        confidence: 0,
        capability: AICapability.ASK,
      }
    }
  }

  isAvailable(): boolean { return this.available }
  async dispose(): Promise<void> { this.available = false; this.config = null }

  private fallbackResponse(): AIResponse {
    return {
      text: '[Anthropic] Provider not configured. Please add API key in AI Settings.',
      confidence: 0,
      capability: AICapability.ASK,
    }
  }
}
