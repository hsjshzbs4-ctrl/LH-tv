// src/ai/index.ts — PB6 AI ERA 统一导出

// Types
export {
  AICapability,
  type IAIProvider,
  type AIContext,
  type AIResponse,
  type ConversationMessage,
  type ConversationThread,
  type PromptTemplate,
  type AIModelConfig,
} from './types/ai.types'

// Governance (PB6-S0)
export {
  AIProviderPolicy,
  ToolPermissionPolicy, toolPermissionPolicy, ToolPermissionLevel,
  MemoryRetentionPolicy, memoryRetentionPolicy, MemoryEntryType, MEMORY_STORE_LIMITS,
  PromptSafetyPolicy, SafetyLevel,
} from './governance'
export type { ProviderPolicyCheck, ToolPermissionRule, MemoryEntry, RetentionRule, SafetyCheckResult } from './governance'

// Orchestrator
export { AIOrchestrator, aiOrchestrator } from './orchestrator/AIOrchestrator'

// Prompt
export { PromptManager, promptManager } from './prompt/PromptManager'

// Conversation
export { ConversationManager, conversationManager } from './conversation/ConversationManager'

// Providers
export { MockAIProvider } from './provider/MockAIProvider'
export { OpenAIProvider } from './provider/OpenAIProvider'
export { AnthropicProvider } from './provider/AnthropicProvider'
export { OllamaProvider } from './provider/OllamaProvider'
export { ModelGateway, modelGateway } from './provider/ModelGateway'
export type { GatewayRequest, GatewayResponse } from './provider/ModelGateway'
