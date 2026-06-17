# PB7-S4 Community Platform — Policy Report

> Date: 2026-06-17
> Phase: PB7-S4 Implementation

---

## Permission Matrix

### Certification Level → Community Action Mapping

| Action | UNCERTIFIED | COMMUNITY | DEVELOPER | OFFICIAL |
|--------|-------------|-----------|-----------|----------|
| **Share** | ✅ SAFE | ✅ SAFE | ✅ SAFE | ✅ SAFE |
| **Rate** | ✅ SAFE | ✅ SAFE | ✅ SAFE | ✅ SAFE |
| **Comment** | ✅ SAFE | ✅ SAFE | ✅ SAFE | ✅ SAFE |
| **Publish Template** | ❌ FORBIDDEN | ⚠️ CONFIRM | ⚠️ CONFIRM | ✅ SAFE |
| **Publish Agent** | ❌ FORBIDDEN | ⚠️ CONFIRM | ⚠️ CONFIRM | ✅ SAFE |
| **Modify Shared Config** | ❌ FORBIDDEN | ⚠️ CONFIRM | ⚠️ CONFIRM | ✅ SAFE |
| **Delete Shared Content** | ❌ FORBIDDEN | ❌ FORBIDDEN | ❌ FORBIDDEN | ✅ SAFE |

### Permission Level Definitions

| Level | Meaning | UX Behavior |
|-------|---------|-------------|
| `SAFE` | No user confirmation needed | Action executes immediately |
| `CONFIRM` | User must explicitly approve | Confirmation dialog shown |
| `FORBIDDEN` | Action blocked at policy level | Error returned, action rejected |

### Implementation

`CommunityPolicy` (static class, following `ExtensionCertificationPolicy` pattern):
- `getPermissionLevel(level, action)` → `CommunityPermissionLevel`
- `canPublish(level)` → boolean
- `canDelete(level)` → boolean
- `canModifySharedConfig(level)` → boolean
- `canRate(level)` → boolean (always true)
- `canComment(level)` → boolean (always true)
- `canShare(level)` → boolean (always true)
- `requiresConfirmation(action)` → boolean
- `validate(level, action)` → `{ allowed, level, reason? }`

### Governance Compliance

- All community actions routed through `CommunityPolicy.validate()` before execution
- Certification level sourced from Ecosystem Governance SSOT (`CertificationLevel` enum)
- UNCERTIFIED users cannot publish content — promotes quality
- OFFICIAL users have full access — reserved for LH-TV team
- 100% coverage: all 7 actions × 4 certification levels defined

### Content Moderation Policy

- Comments submitted with `status: 'pending'`
- `ModerationService.moderateComment()` checks:
  - Profanity keyword list
  - Spam pattern detection (repeated URLs, scam phrases)
- Clean content → `approved`, Flagged content → `flagged`
- Users can escalate via `ReportService`

### Report Resolution Flow

```
User files report → status: pending
    ↓
Review → status: reviewed
    ↓
Resolution → status: resolved | dismissed
```
