# PB7-S4 Community Platform — Architecture Report

> Date: 2026-06-17
> Phase: PB7-S4 Implementation
> Baseline: PB7-S3 CERTIFIED (develop/v2.0 @ 5f847d0)

---

## Architecture Overview

PB7-S4 Community Platform adds a new top-level module `src/community/` as a sibling to `src/ecosystem/`, consuming ecosystem services through the Facade/Registry/HostAPI surface.

### Module Structure

```
src/community/
├── index.ts                          # Top barrel — unified export surface
├── contracts/
│   ├── CommunityItem.ts              # SSOT types: CommunityItem, Rating, Comment, FeedEntry, Report, etc.
│   └── index.ts
├── registry/
│   ├── CommunityRegistry.ts          # SSOT: single source for all community data
│   └── index.ts
├── governance/
│   ├── CommunityPolicy.ts            # Permission matrix: CertificationLevel → CommunityAction
│   └── index.ts
├── feed/
│   ├── FeedBuilder.ts                # Relevance scoring + sorting (stateless)
│   ├── FeedService.ts                # Feed orchestration: Registry → Builder → Feed
│   └── index.ts
├── recommendation/
│   ├── CommunityRecommendation.ts    # Personalized + similar-item recommendations
│   └── index.ts
├── sharing/
│   ├── ShareService.ts              # Share URL generation + clipboard
│   └── index.ts
├── template/
│   ├── TemplateRepository.ts        # Template publish/install/list
│   └── index.ts
└── moderation/
    ├── ModerationService.ts         # Content moderation (keyword + spam detection)
    ├── ReportService.ts             # User reporting system
    └── index.ts
```

### Dependency Graph

```
Community Platform (src/community/)
    │
    ├── contracts/  ← Pure types, zero runtime deps (only imports @ecosystem types)
    ├── governance/ ← Static class, imports CertificationLevel from @ecosystem
    ├── registry/   ← SSOT, imports @platform/flags + @ecosystem + contracts + governance
    ├── feed/       ← Builder (stateless) + Service (orchestrates registry → feed)
    ├── recommendation/ ← Consumes feed service + registry (Facade pattern)
    ├── sharing/    ← Consumes registry + governance
    ├── template/   ← Consumes registry + governance
    └── moderation/ ← Consumes registry
```

### Architecture Patterns Applied

| Pattern | Source | Implementation |
|---------|--------|----------------|
| Contracts layer | ecosystem/contracts | community/contracts (pure types + validation) |
| SSOT Registry | ecosystem/registry/MarketplaceRegistry | community/registry/CommunityRegistry |
| Static governance | ecosystem/governance/ExtensionCertificationPolicy | community/governance/CommunityPolicy |
| Barrel exports | ecosystem/index.ts | community/index.ts + sub-barrels |
| Singleton pattern | All ecosystem managers | All community services |
| Feature flag gating | ecosystem/runtime/ExtensionRuntime | All community public methods |

### Integration Points

| Community → Ecosystem | Access Pattern | Read/Write |
|----------------------|---------------|------------|
| MarketplaceRegistry | `marketplaceRegistry.has()`, `marketplaceRegistry.get()` | Read-only |
| CertificationLevel | Imported from `@ecosystem/index` | Read-only (SSOT) |
| FeatureFlagManager | `featureFlagManager.isEnabled('pb7.community')` | Read-only |
| ExtensionManifest types | Imported from `@ecosystem/index` | Type reuse |

### Forbidden Paths (Verified)

- ❌ Community → Core (`src/core/`) — 0 imports
- ❌ Community → Provider (`src/provider-*/`) — 0 imports
- ❌ Community → Ecosystem Runtime (`src/ecosystem/runtime/`) — 0 imports (only through barrel)
- ❌ Community → Ecosystem Permission (`src/ecosystem/permission/`) — 0 imports (only through barrel)
- ❌ Community → Ecosystem Host (`src/ecosystem/host/`) — 0 imports (only through barrel)
- ❌ Community → AI (`src/ai/`) — 0 imports

### Feature Flag

`pb7.community` (default OFF, depends on `pb7.extension`) gates:
- CommunityRegistry (all public methods)
- FeedService (all public methods)
- FeedBuilder (stateless — no gate needed)
- CommunityRecommendation (all public methods)
- TemplateRepository (all public methods)
- ShareService (all public methods)
- ModerationService (moderateAll, getModerationQueue)
- ReportService (all public methods)

Coverage: 100%

---

## File Statistics

| Layer | Files | Lines (approx) |
|-------|-------|----------------|
| Contracts | 2 | 200 |
| Governance | 2 | 180 |
| Registry | 2 | 350 |
| Feed | 3 | 140 |
| Recommendation | 2 | 140 |
| Sharing | 2 | 80 |
| Template | 2 | 100 |
| Moderation | 3 | 160 |
| Top Barrel | 1 | 80 |
| **Total** | **19** | **~1430** |
