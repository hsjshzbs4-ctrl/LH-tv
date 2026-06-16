// src/integration/continueWatching/resumeCard.ts — PB2-S2 Resume Card

import type { WatchHistoryItem } from '@/core/history/types/history.types'

export interface ResumeCard {
  mediaId: string
  episodeId: string
  providerId: string
  title: string
  cover: string
  episodeLabel: string
  progress: number
  progressPercent: number
  lastPosition: number
  duration: number
  lastWatchedAt: number
}

const MIN_RESUME_POSITION = 30 // 秒
const MAX_RESUME_PROGRESS = 0.95 // 95% 以上不显示续播

export function createResumeCard(item: WatchHistoryItem | null): ResumeCard | null {
  if (!item) return null
  if (item.currentTime < MIN_RESUME_POSITION) return null
  if (item.progress >= MAX_RESUME_PROGRESS) return null

  return {
    mediaId: item.mediaId,
    episodeId: item.episodeId,
    providerId: item.providerId,
    title: item.title,
    cover: item.cover,
    episodeLabel: item.episodeLabel,
    progress: item.progress,
    progressPercent: Math.round(item.progress * 100),
    lastPosition: item.currentTime,
    duration: item.duration,
    lastWatchedAt: item.lastWatchedAt,
  }
}

export function shouldShowResume(item: WatchHistoryItem | null): boolean {
  return createResumeCard(item) !== null
}
