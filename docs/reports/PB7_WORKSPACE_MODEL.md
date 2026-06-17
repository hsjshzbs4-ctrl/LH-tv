# PB7-S5 Workspace Model
> Date: 2026-06-17

## Structure
Tenant → Department → Workspace (hierarchical isolation)

## WorkspaceService
- create(tenantId, departmentId, name): enforces tenant existence + department belonging
- get(workspaceId, tenantId): cross-tenant isolation enforced
- listByTenant(tenantId): scoped listing
- addMember/removeMember: member management

## OrganizationRegistry (SSOT)
Unified storage for Tenant, Department, Workspace, Member. export(), clearTenant().
