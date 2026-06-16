# PLAYER PRODUCTION CHECKLIST

> Phase: PB2-S3B-6 | Baseline: `a2be96a` | Date: 2026-06-16

---

## Playback

| # | Feature | Owner | Code Path | Verified | Risk | Status |
|---|---------|-------|-----------|----------|------|--------|
| 1 | **Play** | PlayerFacade | PlayerPage.togglePlay → store.play → facade.play → engine.play → adapter.play → video.play | ✅ | LOW | READY |
| 2 | **Pause** | PlayerFacade | PlayerPage.togglePlay → store.pause → facade.pause → engine.pause → adapter.pause → video.pause | ✅ | LOW | READY |
| 3 | **Seek** | PlayerFacade | ProgressBar click / Arrow keys → store.seek → facade.seek → engine.seek → adapter.seek | ✅ | LOW | READY |
| 4 | **Replay** | PlayerPage | Ended → replay button → store.seek(0) + store.play() | ✅ | LOW | READY |
| 5 | **End** | PlayerFacade | video.ended → adapter.onEnded → engine ENDED event → store callback → auto-next or stop | ✅ | LOW | READY |

---

## Audio

| # | Feature | Owner | Code Path | Verified | Risk | Status |
|---|---------|-------|-----------|----------|------|--------|
| 6 | **Volume Set** | PlayerFacade | store.setVolume(0-1) → facade.setVolume → engine.setVolume → adapter.setVolume | ✅ | MEDIUM | READY |
| 7 | **Mute** | PlayerFacade | store.toggleMute → facade.setMuted → engine.setMuted → adapter.setMuted | ✅ | MEDIUM | READY |
| 8 | **Unmute** | PlayerFacade | store.toggleMute (flip) → same path as Mute | ✅ | MEDIUM | READY |

> ⚠️ Volume/Muted: store 本地维护值，不读回 video 实际状态。S3B 规划为后续优化项。

---

## Video

| # | Feature | Owner | Code Path | Verified | Risk | Status |
|---|---------|-------|-----------|----------|------|--------|
| 9 | **Fullscreen** | PlayerPage | toggleFullscreen → containerRef.requestFullscreen / document.exitFullscreen | ✅ | LOW | READY |
| 10 | **Exit Fullscreen** | PlayerPage | document.exitFullscreen (browser API) | ✅ | LOW | READY |
| 11 | **PiP** | VideoPlayer | togglePiP → video.requestPictureInPicture / document.exitPictureInPicture | ⚠️ | MEDIUM | S3C |
| 12 | **Quality Switch** | QualityManager | PlayerPage cycleQuality → store.switchQuality → facade.switchQuality → QualityManager.setQuality → hls.nextLevel | ✅ | LOW | READY |

> ⚠️ PiP: 仅在 VideoPlayer.vue 中实现（TREE B），未集成到 PlayerPage。S3C 统一。
> ✅ Quality: S3A-4 修复后，HLS 实例正确绑定。

---

## Subtitle

| # | Feature | Owner | Code Path | Verified | Risk | Status |
|---|---------|-------|-----------|----------|------|--------|
| 13 | **Enable Subtitle** | SubtitleManager | store.enableSubtitles → facade.enableSubtitle → SubtitleManager.enableSubtitle → textTracks.mode='showing' | ✅ | LOW | READY |
| 14 | **Disable Subtitle** | SubtitleManager | store.disableSubtitles → facade.disableSubtitle → SubtitleManager.disableSubtitle → textTracks.mode='disabled' | ✅ | LOW | READY |
| 15 | **Switch Subtitle** | SubtitleManager | facade.switchSubtitleTrack(trackId) → SubtitleManager.switchTrack → applyTrackState | ⚠️ | LOW | S3C |

> ⚠️ Subtitle track selection UI (dropdown) planned for S3C. Manager infrastructure ready.

---

## Episode

| # | Feature | Owner | Code Path | Verified | Risk | Status |
|---|---------|-------|-----------|----------|------|--------|
| 16 | **Episode List** | EpisodeManager | PlayerPage 📺 button → showEpisodePanel → store.allEpisodes → EpisodeManager.getEpisodes() | ✅ | LOW | READY |
| 17 | **Episode Switch** | EpisodeManager | selectEpisode → store.switchEpisode → facade.switchEpisode → EpisodeManager.selectById → engine.loadSource | ✅ | LOW | READY |
| 18 | **Episode Restore** | EpisodeManager + ResumeManager | store.loadMedia → facade.loadMedia → EpisodeManager.loadEpisodeList + selectById + ResumeManager.loadPosition | ✅ | LOW | READY |
| 19 | **Auto Next Episode** | EpisodeManager | video.ended → store callback → EpisodeManager.shouldAutoPlayNext + nextEpisode → switchEpisode(next, next.url) | ✅ | LOW | READY |

> ✅ S3B-2: EpisodeManager is sole SSOT for episode state.

---

## Source

| # | Feature | Owner | Code Path | Verified | Risk | Status |
|---|---------|-------|-----------|----------|------|--------|
| 20 | **Source Switch (Auto)** | SourceSwitchManager | player:error → facade.tryNextSource → sourceSwitch.onFailed → nextSource → engine.loadSource | ✅ | LOW | READY |
| 21 | **Source Failure** | SourceSwitchManager | adapter error → engine ERROR event → store callback → hasMoreSources? tryNextSource : setError | ✅ | LOW | READY |
| 22 | **Source Exhausted** | SourceSwitchManager | onFailed returns null → store sets error="所有播放源均已尝试" → ErrorState with retry | ✅ | LOW | READY |
| 23 | **Fallback (Manual)** | PlayerPage | ErrorState retry button → store.tryNextSource → facade.tryNextSource | ✅ | LOW | READY |

> ✅ S3A-3: SourceSwitchManager integrated. S3B-1: HLS rebind on source switch.
> ✅ S3B-1: isSwitching double-switch guard in PlayerFacade + playerStore.

---

## Resume

| # | Feature | Owner | Code Path | Verified | Risk | Status |
|---|---------|-------|-----------|----------|------|--------|
| 24 | **Resume Save** | ResumeManager | ① onProgressSave (15s) ② player:pause ③ store.destroy → ResumeManager.savePosition → localStorage + historyFacade | ✅ | LOW | READY |
| 25 | **Resume Restore** | ResumeManager | store.loadMedia → facade.resume.loadPosition(episodeId) → localStorage → showResumeDialog + seek | ✅ | LOW | READY |
| 26 | **Continue Watching** | ContinueWatchingService | DetailPage.goToPlay → continueWatchingService.getResumeCard → historyFacade → router.push(resume=true) | ✅ | LOW | READY |

> ✅ S3B-3: All 3 save triggers wired. Restore chain consistent.

---

## Analytics

| # | Event | Emission Point | Data | Verified | Status |
|---|-------|---------------|------|----------|--------|
| 27 | **PLAY** | playerStore: player:play callback | { mediaId } | ✅ | READY |
| 28 | **PAUSE** | playerStore: player:pause callback | — | ✅ | READY |
| 29 | **SEEK** | playerStore.seek() + store.play() (resume) | { time, source? } | ✅ | READY |
| 30 | **COMPLETE** | playerStore: player:ended callback | — | ✅ | READY |
| 31 | **SOURCE_SWITCH** | playerStore: onSourceSwitch callback | { event, fromSource, toSource, reason } | ✅ | READY |
| 32 | **EPISODE_SWITCH** | playerStore.switchEpisode() | { episodeId, episodeNumber } | ✅ | READY |
| 33 | **RESUME_SEEK** | playerStore.play() (resume path) | { time, source: 'resume' } | ✅ | READY |
| 34 | **PLAYER_OPEN** | playerStore.loadMedia() | { mediaId, episodeId, providerId } | ✅ | READY |
| 35 | **QUALITY_SWITCH** | playerStore.switchQuality() | { quality } | ✅ | READY |

> ✅ S3B-4: All 6 mandatory events covered. 0 silent paths.
> ✅ 9 total event types emitted across full lifecycle.

---

## Summary

| Category | Features | Ready | Deferred | Risk |
|----------|----------|-------|----------|------|
| Playback | 5 | 5 | 0 | LOW |
| Audio | 3 | 3 | 0 | MEDIUM (volume readback) |
| Video | 4 | 3 | 1 (PiP → S3C) | LOW |
| Subtitle | 3 | 2 | 1 (UI → S3C) | LOW |
| Episode | 4 | 4 | 0 | LOW |
| Source | 4 | 4 | 0 | LOW |
| Resume | 3 | 3 | 0 | LOW |
| Analytics | 9 | 9 | 0 | LOW |
| **Total** | **35** | **33** | **2** | |

**Overall: 94% READY. 2 features deferred to S3C (PiP, Subtitle UI).**
