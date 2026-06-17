# PB7-S5 RBAC Report
> Date: 2026-06-17

## Roles
| Role | Permissions |
|------|-------------|
| admin | user.*, org.*, workspace.*, audit.*, compliance.*, community.delete |
| manager | org.read, workspace.*, audit.read, community.publish, community.modify |
| member | org.read, workspace.read, community.publish, community.rate, community.comment, community.share |
| viewer | org.read, workspace.read, community.rate, community.comment, community.share |

## PermissionDefinition SSOT (10 permissions)
user.read, user.write, org.read, org.write, workspace.read, workspace.write, audit.read, compliance.read, compliance.write, community.delete

All using PermissionRisk enum: LOW/MEDIUM/HIGH/CRITICAL. Role permissions reference PermissionDefinition.id[] (no raw strings).
