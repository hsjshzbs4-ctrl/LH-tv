// src/ai/prompt/PromptManager.ts — Prompt 模板管理
// {{variable}} 插值系统

import { AICapability, type PromptTemplate } from '../types/ai.types'

/** 内置模板 */
const BUILTIN_TEMPLATES: PromptTemplate[] = [
  {
    name: 'episode-query',
    capability: AICapability.ASK,
    template: '用户正在观看 {{title}}，当前集数 {{episode}}。类别：{{genre}}。问题：{{query}}',
    variables: ['title', 'episode', 'genre', 'query'],
  },
  {
    name: 'summary',
    capability: AICapability.SUMMARIZE,
    template: '请用 2-3 句话总结剧集 {{title}}（{{year}}）。类型：{{genre}}。',
    variables: ['title', 'year', 'genre'],
  },
  {
    name: 'suggestions',
    capability: AICapability.SUGGEST,
    template: '基于用户观看历史和收藏，推荐 5 部类似内容。偏好：{{preferences}}',
    variables: ['preferences'],
  },
  {
    name: 'playback-assistant',
    capability: AICapability.ASSIST,
    template: '用户指令：{{command}}。当前播放状态：{{playerState}}',
    variables: ['command', 'playerState'],
  },
]

export class PromptManager {
  private templates = new Map<string, PromptTemplate>()

  constructor() {
    for (const tpl of BUILTIN_TEMPLATES) {
      this.templates.set(tpl.name, tpl)
    }
  }

  /** 获取模板 */
  getTemplate(name: string): PromptTemplate | undefined {
    return this.templates.get(name)
  }

  /** 使用模板 + 变量填充生成 prompt */
  render(name: string, variables: Record<string, string>): string {
    const tpl = this.templates.get(name)
    if (!tpl) {
      throw new Error(`Unknown prompt template: ${name}`)
    }

    let result = tpl.template
    for (const [key, value] of Object.entries(variables)) {
      result = result.replaceAll(`{{${key}}}`, value)
    }

    return result
  }

  /** 注册自定义模板 */
  registerTemplate(tpl: PromptTemplate): void {
    this.templates.set(tpl.name, tpl)
  }

  /** 移除模板 */
  removeTemplate(name: string): boolean {
    return this.templates.delete(name)
  }

  /** 列出所有模板 */
  listTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values())
  }
}

export const promptManager = new PromptManager()
