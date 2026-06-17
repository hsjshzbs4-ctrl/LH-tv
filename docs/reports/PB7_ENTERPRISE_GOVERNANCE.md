# PB7-S5 Enterprise Governance Report
> Date: 2026-06-17

## EnterprisePolicy
Maps RBAC roles → Community actions via ROLE_COMMUNITY_MAP.

## CommunityFacade
Only legal entry point for Enterprise → Community. Enforces:
- publish: requires EnterprisePolicy.canPerformAction()
- rate/comment: requires EnterprisePolicy.canPerformAction()
- deleteContent: admin-only (OFFICIAL-equivalent)

## Forbidden
- Enterprise → CommunityRegistry (direct) ❌
- Enterprise → Runtime (direct) ❌
- Enterprise → Core/Provider/AI ❌

## Allowed
Enterprise → CommunityFacade → CommunityRegistry ✅
Enterprise → CommunityFacade → MarketplaceRegistry → Runtime → HostAPI ✅
