# PB6 AI RUNTIME REPORT

> Date: 2026-06-17 | Tests: 1872/1872 PASS

## Runtime Components

| Component | Location | Status |
|-----------|----------|--------|
| AIOrchestrator | `src/ai/orchestrator/` | ✅ Refactored (ModelGateway-based) |
| ModelGateway | `src/ai/provider/ModelGateway.ts` | ✅ Rate limited, safety checked |
| OpenAIProvider | `src/ai/provider/OpenAIProvider.ts` | ✅ fetch /v1/chat/completions |
| AnthropicProvider | `src/ai/provider/AnthropicProvider.ts` | ✅ fetch /v1/messages |
| OllamaProvider | `src/ai/provider/OllamaProvider.ts` | ✅ fetch localhost:11434 |
| MockAIProvider | `src/ai/provider/MockAIProvider.ts` | ✅ Default fallback |

## Provider Call Flow

```
UI/AIChatPanel
  → AIOrchestrator.ask(query, context)
    → promptManager.render(template, vars)
    → modelGateway.complete(request)
      → AIProviderPolicy.validateCallPath(caller)  [governance]
      → PromptSafetyPolicy.checkInput(prompt)       [safety]
      → provider.complete(prompt, context)          [execution]
      → PromptSafetyPolicy.checkOutput(response)    [safety]
      → return GatewayResponse { response, auditId }
    → conversationManager.sendMessage(...)
```

## Provider Configuration

| Provider | Default Model | API Key Required | Endpoint |
|----------|--------------|-----------------|----------|
| Mock | — | No | N/A |
| OpenAI | gpt-4o-mini | Yes | api.openai.com |
| Anthropic | claude-sonnet-4-6 | Yes | api.anthropic.com |
| Ollama | llama3.2 | No | localhost:11434 |

## Safety Measures

- Input PII detection (email, phone, ID card, IP)
- Prompt injection detection (override, manipulation, code injection)
- Output PII leak detection
- Rate limiting: 60 RPM per provider
- Audit ID on every request
