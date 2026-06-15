# LH-TV 项目说明

## RC2 STATUS

| 字段 | 值 |
|------|-----|
| Current Branch | `release/rc2-candidate` |
| Current Commit | `2cf0268` |
| Current Freeze | `RC3-APPROVED` (RC3.1 frozen) |
| Project Phase | PB1 Complete — Beta Freeze Ready |
| Date | 2026-06-15 |

## Frozen Modules

- **Metadata** — TMDB, Bangumi, TVMaze providers
- **Local Media** — Scanner, Matcher, Library, WatchState
- **Media Server** — Jellyfin, Plex, Emby integration
- **Search Index** — CE7 Inverted Index (O(k) search)
- **Unified Search** — CE8 Full search experience (95 files, 266 tests)
- **Recommendation Engine** — CE9 Content-based + collaborative filtering (132 files, 323 tests, 6 layers)

## Architecture Status

| Gate | Value |
|------|-------|
| Type Errors | 0 |
| Circular Dependencies | 0 |
| Tests | 1518 |
| Test Files | 171 |
| Source Files | 491 (.ts + .vue) |

## Git Tags

```
CE7-FREEZE → PRE-CE8-STABLE → CE8-FREEZE → RC2-BASELINE → CE9-B~G-FREEZE → RC3-BASELINE → RC3-APPROVED
```

## Next Milestone

**PB1 Public Beta** — Crash telemetry, user feedback pipeline, performance monitoring, release monitoring

**PB1 Exit Criteria**: 100+ beta users, 95% crash-free, 0 critical bugs, <5 high bugs, 99% startup success

**RC3.1 is FROZEN** — no further stabilization unless critical/security issue. All new work under PB1.

See `docs/MASTER_EXECUTION_DOCUMENT.md` for full roadmap.
