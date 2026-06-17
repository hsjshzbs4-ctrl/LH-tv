# PB6 ARCHITECTURE REPORT

> Phase: PB6 AI ERA | Date: 2026-06-17 | Branch: `develop/v2.0`

## Architecture Overview

```
AI UI Layer:     AIAssistantButton  AIChatPanel  AISettingsView
                       ↓
AI Orchestrator: AIOrchestrator (routing, context assembly)
                       ↓
Governance:      AIProviderPolicy  ToolPermissionPolicy  MemoryRetentionPolicy  PromptSafetyPolicy
                       ↓
            ┌──────────┼──────────┬──────────────┐
       ModelGateway  MemoryStore  ToolRegistry  ContextEngine
       (强制出口)    (10MB限额)   (9 rules)     (RichAIContext)
            │           │            │              │
       OpenAI       ConvMemory   SearchTool      UserContext
       Anthropic    SessMemory   PlaybackTool    MediaContext
       Ollama       PrefMemory   SysTool         HistoryContext
```

## Module Inventory

| Module | Files | Purpose |
|--------|-------|---------|
| governance/ | 5 | Provider/ Tool/ Memory/ Prompt policies |
| provider/ | 5 | ModelGateway + MockAI + OpenAI + Anthropic + Ollama |
| orchestrator/ | 1 | AIOrchestrator (refactored) |
| memory/ | 6 | MemoryStore + Conversation + Session + Preference + Lifecycle |
| tools/ | 7 | ToolRegistry + Pipeline + Search + Playback |
| context/ | 1 | ContextEngine |
| ui/ | 3 | Button + ChatPanel + SettingsView |
| **Total** | **28** | |

## Key Design Decisions

1. **ModelGateway 强制出口**: 禁止 UI/Tool 直接调用 Provider
2. **Governance Layer 先行**: 策略先于实现
3. **MemoryRetentionPolicy 约束**: 禁止 full prompt/response 存储
4. **Adapter Pattern**: 所有平台集成通过 Facade 接口，不修改 Frozen Zone

## Integration Points

- `App.vue`: AIOrchestrator initialization (feature-flag gated)
- `Router`: `/ai/settings` route
- `storageService.settings`: MemoryStore persistence
- `FeatureFlagManager`: `pb5.ai` gate
