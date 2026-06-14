// modules/recommendation/domain/contracts/AIRecommendationProvider.ts — CE9-A
// AI Recommendation Provider — FUTURE USE (CE12+) (Req 3)
// Interface defined NOW. Implementation DEFERRED.
// DO NOT implement in CE9.

import type { IRecommendationProvider } from './IRecommendationProvider'
import type { RecommendationItem } from '../entities/RecommendationItem'
import type { RecommendationContext } from '../entities/RecommendationContext'
import type { RecommendationProfile } from '../entities/RecommendationProfile'

export type AIModelProvider = 'local-llm' | 'openai' | 'claude' | 'ollama' | 'custom'

export interface AIModelConfig {
  readonly temperature?: number
  readonly maxTokens?: number
  readonly topP?: number
  readonly endpoint?: string
  readonly apiKeyEnv?: string
}

export interface AIModelCapabilities {
  readonly supportsReasoning: boolean
  readonly supportsStreaming: boolean
  readonly supportsMultilingual: boolean
  readonly maxContextTokens: number
  readonly estimatedLatencyMs: number
}

export interface AIRecommendationResult {
  readonly items: RecommendationItem[]
  readonly reasoningSummary: string
  readonly confidence: number
  readonly modelUsed: string
  readonly tokensUsed: number
  readonly latencyMs: number
}

/**
 * AI Recommendation Provider — FUTURE USE (CE12+).
 *
 * Unlike traditional scoring engines, AI can reason about:
 * - Narrative similarity ("similar plot structure to...")
 * - Thematic overlap ("explores the same themes as...")
 * - Mood matching ("matches the tone of your favorites")
 *
 * CE9 only defines the interface. Implementation is deferred to CE12.
 * The Runtime engine registry already supports loading AI providers
 * since they extend IRecommendationProvider.
 */
export interface AIRecommendationProvider extends IRecommendationProvider {
  /** Which AI model provider */
  readonly modelProvider: AIModelProvider

  /** Specific model identifier (e.g., 'gpt-4o', 'claude-sonnet-4-6') */
  readonly modelId: string

  /** Model configuration */
  readonly modelConfig: AIModelConfig

  /**
   * Generate a natural-language explanation for WHY this item was recommended.
   * Goes beyond template-based reasons — generates nuanced, personalized text.
   */
  explain(item: RecommendationItem): Promise<string>

  /**
   * Generate recommendations using AI reasoning.
   * Returns items with AI-generated reasoning summary.
   */
  generateWithReasoning(
    ctx: RecommendationContext,
    profile: RecommendationProfile,
    limit: number,
  ): Promise<AIRecommendationResult>

  /** Check if model is available (local LLM loaded, API key set, etc.) */
  isModelAvailable(): Promise<boolean>

  /** Get model capabilities */
  getCapabilities(): AIModelCapabilities
}
