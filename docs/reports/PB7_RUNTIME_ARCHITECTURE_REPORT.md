# PB7 RUNTIME ARCHITECTURE REPORT

> PB7-S3: Ecosystem Runtime Foundation | Date: 2026-06-17 | Auditor: 小涵

## Directory Tree

```
src/ecosystem/
├── index.ts                             # Unified barrel export
├── contracts/
│   ├── index.ts
│   ├── ExtensionManifest.ts             # SSOT — Extension manifest + validator
│   ├── PermissionDefinition.ts          # Permission types + built-in 13 permissions
│   └── RuntimeCapability.ts             # Capability types + built-in 8 capabilities
├── runtime/
│   ├── index.ts
│   ├── ExtensionRuntime.ts              # Main entry — load/stop/restart/unload
│   ├── LifecycleManager.ts              # 6-state state machine + hooks
│   ├── SandboxManager.ts                # STRICT/STANDARD/TRUSTED isolation modes
│   └── ResourceManager.ts               # CPU/Memory/Storage/Network quota
├── permission/
│   ├── index.ts
│   ├── PermissionManager.ts             # Single permission authority — grant/check/audit
│   ├── RuntimePolicy.ts                 # Policy rules — risk-based consent
│   └── CapabilityChecker.ts             # Runtime capability verification
├── registry/
│   ├── index.ts
│   └── MarketplaceRegistry.ts           # Single Marketplace SSOT
├── host/
│   ├── index.ts
│   └── HostAPI.ts                       # Single extension access point
└── governance/
    ├── index.ts
    └── ExtensionCertificationPolicy.ts  # UNCERTIFIED/COMMUNITY/DEVELOPER/OFFICIAL
```

19 source files, 5 test files.

## Runtime Architecture (Data Flow)

```
┌──────────────┐
│  Extension   │  (manifest.json)
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ ExtensionRuntime │  ← Feature Flag: pb7.extension
│  .load(manifest) │
└──────┬───────────┘
       │ 1. validateManifest()
       │ 2. lifecycleManager.register()
       │ 3. sandboxManager.create()
       │ 4. lifecycle: REGISTERED → INSTALLED → LOADED → RUNNING
       ▼
┌──────────────────┐
│ PermissionManager│  ← SSOT for grant/check/audit
│  .check(id, perm)│
└──────┬───────────┘
       │ allowed?
       ▼
┌──────────────────┐
│    HostAPI       │  ← Storage/UI/Network/Commands/Notifications
│  .handle(req)    │     Sandbox check → Permission check → Execute
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  System Service  │  (storageService / IPC / etc.)
└──────────────────┘
```

**Illegal Path (BLOCKED):**
```
Extension → Core Module  ❌
```
Prevented by:
- `SandboxManager.checkAPIAccess()` — STRICT mode blocks all, STANDARD requires allowlist
- `PermissionManager.check()` — requires explicit grant
- `HostAPI` — only entry point, no raw access

## Lifecycle State Machine

```
REGISTERED → INSTALLED → LOADED → RUNNING
                ↓          ↓         ↓
                └──────────┴──── STOPPED
                                      ↓
              (all states → UNINSTALLED)
```

Valid transitions enforced by `VALID_TRANSITIONS` table. Hooks: onRegister/onInstall/onLoad/onStart/onStop/onUninstall.

## SSOT Verification

| Artifact | Location | Status |
|----------|----------|--------|
| ExtensionManifest | `contracts/ExtensionManifest.ts` | ✅ Single source |
| PermissionDefinition | `contracts/PermissionDefinition.ts` | ✅ Single source |
| RuntimeCapability | `contracts/RuntimeCapability.ts` | ✅ Single source |

No duplicate types. All layers reference contract types.

## Feature Flag Gating

| Component | Flag | Check |
|-----------|------|-------|
| ExtensionRuntime.initialize() | pb7.extension | ✅ |
| ExtensionRuntime.ensureInitialized() | pb7.extension | ✅ (runtime check) |

`pb7.extension` defaults to `FeatureState.OFF`, depends on `pb6.ai`.
