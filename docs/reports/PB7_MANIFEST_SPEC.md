# PB7 MANIFEST SPECIFICATION

> PB7-S3: Extension Manifest SSOT | Date: 2026-06-17

## ExtensionManifest — Single Source of Truth

All modules (Runtime, SDK, Marketplace, Governance, Community, Enterprise) MUST use this single definition.

```typescript
interface ExtensionManifest {
  id: string              // "<publisher>.<name>" e.g. "acme.search-plugin"
  name: string            // Human-readable
  version: string         // SemVer e.g. "1.0.0"
  publisher: {
    id: string            // Publisher unique ID
    name: string          // Publisher display name
    email?: string
    url?: string
  }
  signature: string       // Content hash (min 32 chars)
  runtimeVersion: string  // Minimum runtime version
  type: ExtensionType     // plugin | theme | ai_agent | template | capability_pack
  entry: string           // Entry module path
  description: string     // Description
  icon?: string           // Icon URL
  permissions: Array<{    // Required permissions
    id: string
    reason: string
  }>
  capabilities: Array<{   // Required capabilities
    id: string
  }>
  dependencies: string[]  // Extension IDs this depends on
  metadata?: Record<string, unknown>
}
```

## Extension Types

| Type | Use Case |
|------|----------|
| `plugin` | Data/subtitle/analytics providers |
| `theme` | UI themes and skins |
| `ai_agent` | AI capability agents |
| `template` | Config/layout templates |
| `capability_pack` | Standalone feature modules |

## Manifest Validation Rules

Performed by `validateManifest()` — called at every registration entry point:

1. **Required fields**: id, name, version, publisher (id+name), entry, type, permissions[], capabilities[]
2. **Type validation**: id format `<publisher>.<name>`, version SemVer, type ∈ ExtensionType
3. **Warnings**: missing signature, non-SemVer version, missing runtimeVersion
4. **Publisher validation**: publisher must have id + name

## Prohibited Patterns

- ❌ `MarketplaceManifest` — use ExtensionManifest
- ❌ `SDKManifest` — use ExtensionManifest
- ❌ `RuntimeManifest` — use ExtensionManifest
- ❌ Multiple manifest versions — ONE definition, ONE validator

## Certification Levels

| Level | Requirements |
|-------|-------------|
| UNCERTIFIED | No signature or has dangerous permissions |
| COMMUNITY | Has signature, minor issues |
| DEVELOPER | Complete, valid, publisher verified |
| OFFICIAL | LH-TV team reviewed and approved |

## Security Classification

| Class | Trigger |
|-------|---------|
| SAFE | No dangerous/review permissions |
| REVIEW_NEEDED | Has network.fetch, media.access, or filesystem.read |
| DANGEROUS | Has filesystem.write, settings.write, or network.websocket |
