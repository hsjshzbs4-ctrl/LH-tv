# LH-TV 项目说明

## RC2 STATUS

| 字段 | 值 |
|------|-----|
| Current Branch | `release/rc2-candidate` |
| Current Commit | `f1d800c` |
| Current Freeze | `CE8-FREEZE` |
| Project Phase | RC2 Candidate |
| Date | 2026-06-14 |

## Frozen Modules

- **Metadata** — TMDB, Bangumi, TVMaze providers
- **Local Media** — Scanner, Matcher, Library, WatchState
- **Media Server** — Jellyfin, Plex, Emby integration
- **Search Index** — CE7 Inverted Index (O(k) search)
- **Unified Search** — CE8 Full search experience (95 files, 266 tests)

## Architecture Status

| Gate | Value |
|------|-------|
| Type Errors | 0 |
| Circular Dependencies | 0 |
| Tests | 1012+ |
| Test Files | 130+ |
| Source Files | ~400+ |

## Git Tags

```
CE7-FREEZE → PRE-CE8-STABLE → CE8-FREEZE → RC2-BASELINE
```

## Next Planned Milestone

**CE9 Recommendation Engine** — Content-based + collaborative filtering
