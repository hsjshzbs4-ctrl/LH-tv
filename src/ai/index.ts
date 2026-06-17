// src/ai/index.ts — S5-5 AI Assistant Framework 统一导出

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

// Orchestrator
export { AIOrchestrator, aiOrchestrator } from './orchestrator/AIOrchestrator'

// Prompt
export { PromptManager, promptManager } from './prompt/PromptManager'

// Conversation
export { ConversationManager, conversationManager } from './conversation/ConversationManager'

// Provider
export { MockAIProvider } from './provider/MockAIProvider'
