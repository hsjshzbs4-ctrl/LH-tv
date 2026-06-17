# PB7 PERMISSION MODEL REPORT

> PB7-S3: Permission System | Date: 2026-06-17 | Auditor: 小涵

## Permission Architecture

```
Extension.permissions[] (Manifest declaration)
        ↓
PermissionManager.grant() (Runtime authorization)
        ↓
PermissionManager.check() → PermissionCheckResult
        ↓
RuntimePolicy.evaluate() → requiresUserConsent?
        ↓
HostAPI.handle() → Sandbox check → Permission check → Execute
```

## Built-in Permissions (13)

| ID | Name | Risk Level |
|----|------|-----------|
| storage.read | Storage Read | LOW |
| storage.write | Storage Write | MEDIUM |
| ui.render | UI Render | LOW |
| ui.overlay | UI Overlay | MEDIUM |
| network.fetch | Network Fetch | HIGH |
| network.websocket | Network WebSocket | HIGH |
| command.execute | Command Execute | MEDIUM |
| notification.send | Notification Send | LOW |
| media.access | Media Access | HIGH |
| settings.read | Settings Read | LOW |
| settings.write | Settings Write | CRITICAL |
| filesystem.read | Filesystem Read | CRITICAL |
| filesystem.write | Filesystem Write | CRITICAL |

## Risk-Based Consent

| Risk Level | Auto-grant? | User Consent? |
|-----------|-------------|---------------|
| LOW | ✅ Yes | No |
| MEDIUM | ✅ Yes | No (unless policy overrides) |
| HIGH | ⚠️ Yes | Yes (required by default policy) |
| CRITICAL | ⚠️ Yes | Yes (always required) |

Implemented by `RuntimePolicy.evaluate()` and `PermissionManager.check()`.

## Policy Rules (4)

| Rule | Scope | Threshold |
|------|-------|-----------|
| critical-needs-consent | All | HIGH+ |
| high-needs-consent | All | MEDIUM+ |
| network-isolate | network.* | LOW+ |
| filesystem-block | filesystem.write | LOW+ |

## Audit Trail

`PermissionManager` maintains in-memory audit log (max 1000 entries):
- `grant` / `deny` / `revoke` / `check` actions
- Per-extension filtering via `getAuditLogFor(extensionId)`
- Timestamp + reason for each entry

## Capability System (8)

| Capability | Description |
|-----------|-------------|
| host.storage | Extension-scoped KV storage |
| host.ui | UI rendering slots |
| host.network | Proxied network requests |
| host.commands | Command system integration |
| host.notifications | Desktop/in-app notifications |
| host.media | Media library access |
| host.worker | Background worker threads |
| host.ai | AI orchestration access |

Verified at `ExtensionRuntime.load()` time by `CapabilityChecker`.
