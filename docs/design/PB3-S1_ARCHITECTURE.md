# PB3-S1 ARCHITECTURE — Player UX Upgrade

> Status: IMPLEMENTED | Date: 2026-06-16 | Baseline: PB2-FINAL (`7f0a2d3`)

## Modules

| Module | Owner | Location | Files |
|--------|-------|----------|-------|
| Gesture Control | GestureController | `src/player/gesture/` | 4 |
| Subtitle Settings | SubtitleSettingsManager | `src/player/subtitle/` | 3 |
| Episode UX | EpisodeUX | `src/player/episodeUX.ts` | 1 |
| Continue Watching UX | ContinueWatchingUX | `src/player/continueWatchingUX.ts` | 1 |
| Fullscreen UX | FullscreenUX | `src/player/fullscreenUX.ts` | 1 |

## PB3 Rules Compliance

| Rule | Status |
|------|--------|
| 禁止修改 Frozen Modules | ✅ 0 changes |
| 只能扩展/包装/增强 | ✅ All new files |
| 禁止重构核心 | ✅ No core edits |
| SSOT 原则 | ✅ Each module one owner |

## Architecture

```
                    ┌──────────────────────┐
                    │   PB3-S1 NEW LAYER   │
                    │                      │
    PlayerPage ────┤ GestureController    │
                    │ SubtitleSettingsMgr  │
                    │ EpisodeUX            │
                    │ ContinueWatchingUX   │
                    │ FullscreenUX         │
                    └──────┬───────────────┘
                           │ wraps (not modifies)
                    ┌──────▼───────────────┐
                    │   PB2 FROZEN LAYER   │
                    │                      │
                    │ PlayerFacade         │
                    │ EpisodeManager       │
                    │ ResumeManager        │
                    │ QualityManager       │
                    │ SubtitleManager      │
                    │ SourceSwitchManager  │
                    └──────────────────────┘
```
