// src/ai/types/ai.types.ts — S5-5 AI Framework 核心类型
// PB5 Auth v2: Mock/Dummy Provider only, no real model access

/** AI 能力 */
export enum AICapability {
  ASK = 'ask',
  SUMMARIZE = 'summarize',
  SUGGEST = 'suggest',
  ASSIST = 'assist',
}

/** AI 上下文 (当前媒体、历史、收藏等) */
export interface AIContext {
  currentMedia?: {
    title: string
    episode?: string
    genre?: string[]
    year?: number
  }
  history?: string[]
  favorites?: string[]
  preferences?: Record<string, unknown>
}

/** AI 响应 */
export interface AIResponse {
  text: string
  confidence: number
  capability: AICapability
  sources?: string[]
  metadata?: Record<string, unknown>
}

/** 对话消息 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

/** 对话线程 */
export interface ConversationThread {
  id: string
  title: string
  messages: ConversationMessage[]
  createdAt: number
  updatedAt: number
  context?: AIContext
}

/** Prompt 模板 */
export interface PromptTemplate {
  name: string
  capability: AICapability
  template: string
  variables: string[]
}

/** AI 模型配置 */
export interface AIModelConfig {
  provider: 'mock' | 'dummy'
  model?: string
  apiKey?: string
  endpoint?: string
}

/** AI Provider 接口 */
export interface IAIProvider {
  readonly name: string
  readonly capabilities: AICapability[]

  /** 初始化 */
  initialize(config: AIModelConfig): Promise<void>
  /** 执行完成 */
  complete(prompt: string, context?: AIContext): Promise<AIResponse>
  /** 是否可用 */
  isAvailable(): boolean
  /** 销毁 */
  dispose(): Promise<void>
}
