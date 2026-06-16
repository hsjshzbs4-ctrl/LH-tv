# PB4 RC-4 — Deployment Runbook

> Status: DOCUMENTED | Date: 2026-06-16

## Build

```bash
npm ci
npm run typecheck
npm run test
npm run build
```

## Release

```bash
git tag -a v1.0.0 -m "LH-TV 1.0 Production Release"
git push origin v1.0.0
```

## Rollback

```bash
git checkout <previous-stable-tag>
npm ci && npm run build
# Redeploy previous build artifacts
```

## Emergency Recovery

1. Identify: check CrashReporter dashboard
2. Assess: check ReliabilityDashboard
3. Rollback: deploy previous stable tag
4. Fix: create hotfix branch from tag
5. Release: tag as v1.0.x-hotfix

## Version Tagging

```
v1.0.0  → Production release
v1.0.1  → Hotfix
v1.1.0  → Feature release
v2.0.0  → Breaking change
```

## Hotfix Process

```bash
git checkout v1.0.0
git checkout -b hotfix/critical-fix
# ... fix + test + typecheck ...
git tag -a v1.0.1 -m "Hotfix: ..."
```
