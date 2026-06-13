// src/core/continue-watching/types/continue.types.ts

export interface ContinueWatchingItem {
  mediaId: string
  episodeId: string
  providerId: string
  title: string
  cover: string
  episodeLabel: string
  duration: number
  currentTime: number
  progress: number
  lastWatchedAt: number
}
