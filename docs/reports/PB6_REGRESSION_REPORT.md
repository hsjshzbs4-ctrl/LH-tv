# PB6 REGRESSION REPORT

> Baseline: PB5 develop/v1.1 | Current: PB6 develop/v2.0 | Date: 2026-06-17

## Test Comparison

| Metric | PB5 Baseline | PB6 | Delta |
|--------|-------------|-----|-------|
| Test Files | 211 | 212 | **+1** |
| Tests | 1850 | 1872 | **+22** |
| TypeScript | 0 | 0 | 0 |
| Circular Deps | 0 | 0 | 0 |
| Build | PASS | PASS | ✅ |

## v1.0 User Flow Verification

| Flow | PB5 | PB6 (AI OFF) |
|------|-----|--------------|
| 首页 | ✅ | ✅ Preserved |
| 分类 | ✅ | ✅ Preserved |
| 搜索 | ✅ | ✅ Preserved |
| 详情 | ✅ | ✅ Preserved |
| 播放 | ✅ | ✅ Preserved |
| 收藏 | ✅ | ✅ Preserved |
| 历史 | ✅ | ✅ Preserved |
| 设置 | ✅ | ✅ Preserved |

## Frozen Zone Verification

| Module | PB5 | PB6 |
|--------|-----|-----|
| PlayerFacade | 0 changes | 0 changes |
| EpisodeManager | 0 changes | 0 changes |
| ResumeManager | 0 changes | 0 changes |
| QualityManager | 0 changes | 0 changes |
| SourceSwitchManager | 0 changes | 0 changes |
| ErrorRecoveryManager | 0 changes | 0 changes |
| CrashReporter | 0 changes | 0 changes |
| ProductionTelemetry | 0 changes | 0 changes |

## Files Modified Outside PB6 Modules

| File | Change | Risk |
|------|--------|------|
| `src/App.vue` | AI initialization in onMounted | LOW |
| `src/router/index.ts` | aiRoutes spread | LOW |

## Conclusion

**PASS** ✅ — PB6 introduces zero regressions. AI OFF = v1.0 behavior unchanged.
