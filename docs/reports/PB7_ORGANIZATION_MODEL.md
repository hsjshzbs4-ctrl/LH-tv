# PB7-S5 Organization Model
> Date: 2026-06-17

## OrganizationService
createTenant(), listTenants(), createDepartment(), getMembers(), export(), clearTenant()

## Multi-tenancy
- Tenants fully isolated
- Departments scoped to tenant
- Workspaces require tenant + department validation
- Cross-tenant access blocked at OrganizationRegistry level

## GDPR Support
- clearTenant() cascades: tenants, departments, workspaces, members
- export() produces full data snapshot
- IdentityRegistry, AuditStore, RBACManager all support clearTenant()
