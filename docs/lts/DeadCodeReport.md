# Dead Code Report — Sprint #1

**Date**: 2026-06-18
**Branch**: `release/v3.0.x`
**Tool**: ts-prune 0.10.3

---

## 1. Policy

Per LTS Section 3 (Frozen Zone), the following directories are **FROZEN**:

```
src/ai/**
src/ecosystem/**
src/community/**
src/enterprise/**
src/governance/**
```

**Rule**: Identify and classify dead exports. Do NOT delete anything from Frozen Zone. Only generate this report.

---

## 2. Classification Summary

| Category | Count | Action |
|----------|-------|--------|
| **Barrel Export (Public API)** | ~120+ | ✅ KEEP — These are intentional public API surface |
| **Used in Module** | ~15 | ✅ KEEP — ts-prune false positive, used within same module |
| **Unused Export (non-Frozen)** | ~15 | ⚠️ REVIEW — Safe to clean up |
| **Unused Export (Frozen Zone)** | 0 | ✅ None (all Frozen exports are barrel/public) |

---

## 3. Frozen Zone Analysis

### src/ai/index.ts (Barrel Export)

All exports are intentional Public API for the AI module:

| Export | Type |
|--------|------|
| AICapability, IAIProvider, AIContext, AIResponse | Core types |
| ConversationMessage, ConversationThread | Conversation types |
| PromptTemplate, AIModelConfig | Config types |
| AIProviderPolicy, ToolPermissionPolicy, MemoryRetentionPolicy | Governance types |
| PromptSafetyPolicy, SafetyLevel | Safety types |
| AIOrchestrator, aiOrchestrator | Orchestrator singleton |
| PromptManager, promptManager | Prompt manager singleton |
| ConversationManager, conversationManager | Conversation manager singleton |
| MockAIProvider, OpenAIProvider, AnthropicProvider, OllamaProvider | Provider classes |
| ModelGateway, modelGateway | Gateway singleton |

> ✅ ALL INTENTIONAL — Part of the public AI module API. No action required.

### src/ecosystem/index.ts (Barrel Export)

Similar pattern — all exports are intentional public API for the Ecosystem module.

### src/community/index.ts (Barrel Export)

All exports are intentional public API for the Community module.

### src/enterprise/index.ts (Barrel Export)

All exports are intentional public API for the Enterprise module.

### src/governance/index.ts

(No ts-prune output — governance exports are likely consumed)

---

## 4. Non-Frozen — Unused Exports

### electron/utils/config.ts

| Export | Status |
|--------|--------|
| POSTER_DIR | Unused |
| DOWNLOADS_DIR | Unused |
| API_SITES | Unused |
| CONTENT_FILTER | Unused |
| STORAGE_KEYS | Unused |
| STORAGE_LIMITS | Unused |
| CACHE | Unused |
| IPC_TIMEOUT | Unused |
| DOWNLOAD | Unused |
| PLAYER | Unused |

> ⚠️ These are configuration constants that may have been added for future use. SAFE TO CLEAN but kept per "minimal change" principle.

### electron/utils/http-client.ts

| Export | Status |
|--------|--------|
| fetchJson | Unused |
| fetchText | Unused |

> ⚠️ Utility functions. May be used by future code. SAFE TO CLEAN.

### electron/runtime/index.ts

| Export | Status |
|--------|--------|
| gracefulShutdown | Unused |
| registerShutdownHooks | Unused |
| attachRendererRecovery | Unused |
| attachUnresponsiveRecovery | Unused |
| attachLoadFailureRecovery | Unused |

> ⚠️ These are likely called internally via the runtime module's own initialization. Verify before any action.

### composables

| Export | Status |
|--------|--------|
| useKeyboard | Unused |
| usePlayer | Unused |
| useScroll | Unused |
| useStorageSync | Unused |
| useVirtualList | Unused |

> ⚠️ Vue composables — may be used in .vue files that ts-prune cannot analyze. Likely FALSE POSITIVES.

---

## 5. Recommendation

### No Action (Sprint #1)

Per LTS policy and the "minimal change" principle:

- ✅ **Frozen Zone**: Zero changes allowed. All exports are intentional public API.
- ✅ **Composables**: Likely false positives (used in .vue SFC files). No action.
- ✅ **Runtime exports**: Likely false positives (internal initialization). No action.
- ⚠️ **Config constants**: Low priority. Can be cleaned in a future sprint after verification.

### Future Sprint

If dead code cleanup is desired:

1. Verify each unused export against the full codebase (including .vue files)
2. Only clean `electron/utils/config.ts` and `electron/utils/http-client.ts` unused exports
3. Do NOT touch composables without runtime verification
4. Do NOT touch Frozen Zone exports under any circumstances
