// local-media/watch/WatchStateManager.ts — CE5.11
// Track watch progress, resume positions, continue watching

import type { WatchState } from '../contracts/local-media.types'
import type { LibraryRepository } from '../library/LibraryRepository'

export class WatchStateManager {
  constructor(private repository: LibraryRepository) {}

  getWatchState(mediaId: string): WatchState | undefined {
    return this.repository.getWatchState(mediaId)
  }

  updatePosition(mediaId: string, mediaType: 'movie' | 'episode', position: number, duration: number): void {
    const progress = duration > 0 ? position / duration : 0
    this.repository.setWatchState({
      mediaId,
      mediaType,
      position,
      duration,
      progress,
      lastWatched: Date.now(),
      completed: progress >= 0.95,
    })
  }

  markCompleted(mediaId: string): void {
    const state = this.repository.getWatchState(mediaId)
    if (state) {
      this.repository.setWatchState({ ...state, completed: true, lastWatched: Date.now() })
    }
  }

  getContinueWatching(limit = 20): WatchState[] {
    return this.repository.getWatchStates()
      .filter(w => !w.completed && w.progress > 0.01)
      .sort((a, b) => b.lastWatched - a.lastWatched)
      .slice(0, limit)
  }

  getResumePosition(mediaId: string): number {
    const state = this.repository.getWatchState(mediaId)
    return state && state.position > 5 ? state.position : 0 // skip <5s positions
  }

  async save(): Promise<void> {
    await this.repository.save()
  }
}
