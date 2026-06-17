# PB7-S5 Enterprise Integration — Architecture Report
> Date: 2026-06-17 | Phase: PB7-S5 | Baseline: PB7-S4 CERTIFIED

## Module Structure
```
src/enterprise/
├── index.ts                    # Top barrel
├── contracts/                  # SSOT types + enums + validators
├── identity/                   # IdentityRegistry (SSOT) + IdentityProvider + SSOManager + LDAP/SCIM
├── organization/               # OrganizationRegistry (SSOT) + OrganizationService + WorkspaceService
├── auth/                       # RBACManager (SSOT) + RoleDefinition
├── audit/                      # AuditStore (SSOT) + AuditLogger + AuditQuery
├── compliance/                 # CompliancePolicy (holds rules) + ComplianceChecker (executes)
├── governance/                 # EnterprisePolicy (RBAC → Community mapping)
└── facade/                     # CommunityFacade (only legal entry to Community)
```

## Key Decisions
| Decision | Rationale |
|----------|-----------|
| IdentityRegistry SSOT | No direct new LDAPProvider/SCIMProvider |
| PermissionDefinition.id[] | Role references IDs, not strings |
| AuditStore middle layer | Logger → Store → Query three-tier |
| CompliancePolicy owns rules | Checker only executes |
| OrganizationRegistry SSOT | No multiple Maps |
| CommunityFacade | No direct CommunityRegistry import |

## File Count: 25 source + 6 test + 5 config + 8 reports = 44 files
