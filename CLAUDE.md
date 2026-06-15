# LH-TV 项目说明

## RC2 STATUS

| 字段 | 值 |
|------|-----|
| Current Branch | `release/rc2-candidate` |
| Current Commit | `f1d800c` |
| Current Freeze | `CE9-G-FINAL-FREEZE` |
| Project Phase | RC2 Candidate |
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
| Tests | 1300+ |
| Test Files | 154 |
| Source Files | 469 (.ts + .vue) |

## Git Tags

```
CE7-FREEZE → PRE-CE8-STABLE → CE8-FREEZE → RC2-BASELINE → CE9-B-FREEZE → CE9-C-FREEZE → CE9-D-FREEZE → CE9-E-FREEZE → CE9-F-FREEZE → CE9-G-FINAL-FREEZE
```

## Next Planned Milestone

**CE10** — TBD (待规划)
