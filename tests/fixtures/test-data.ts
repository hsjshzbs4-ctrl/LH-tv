// tests/fixtures/test-data.ts — 共享测试数据工厂
// 集中管理所有测试 Fixture，确保类型一致性

import type { MediaItem, MediaDetail, MediaEpisode, AggregatedSearchResult } from '@provider-contracts'
import type { IProvider } from '@provider-contracts'
import type { ProviderMeta } from '@/core/providers/types/provider.types'
import type { FavoriteMedia } from '@/core/favorites/types/favorite.types'
import type { WatchHistoryItem } from '@/core/history/types/history.types'
import type { DownloadTask } from '@/core/download/types/download.types'
import type { OfflineMedia } from '@/core/offline/types/offline.types'
import type { ProviderManifest } from '@provider-contracts'
import type { StorageSchema } from '@/shared/storage/storage.types'

// ============================================================
// 计数器（保证 ID 唯一）
// ============================================================
let _seq = 0
function seq(): number {
  return ++_seq
}

// ============================================================
// Media 相关
// ============================================================

export function createMediaItem(overrides: Partial<MediaItem> = {}): MediaItem {
  const n = seq()
  return {
    id: `media-${n}`,
    title: `Test Media ${n}`,
    cover: `https://example.com/cover-${n}.jpg`,
    providerId: 'test-provider',
    providerName: 'Test Provider',
    type: 'movie',
    year: 2024,
    score: 7.5,
    remark: `Remark ${n}`,
    ...overrides,
  }
}

export function createMediaDetail(overrides: Partial<MediaDetail> = {}): MediaDetail {
  const n = seq()
  return {
    id: `detail-${n}`,
    title: `Test Detail ${n}`,
    cover: `https://example.com/cover-${n}.jpg`,
    description: `Description for test detail ${n}`,
    providerId: 'test-provider',
    episodes: [createMediaEpisode(), createMediaEpisode({ episodeNumber: 2, title: 'Episode 2' })],
    ...overrides,
  }
}

export function createMediaEpisode(overrides: Partial<MediaEpisode> = {}): MediaEpisode {
  const n = seq()
  return {
    id: `ep-${n}`,
    title: `Episode ${n}`,
    episodeNumber: n,
    ...overrides,
  }
}

// ============================================================
// Provider 相关
// ============================================================

export function createProviderMeta(overrides: Partial<ProviderMeta> = {}): ProviderMeta {
  const n = seq()
  return {
    id: `provider-${n}`,
    name: `Test Provider ${n}`,
    enabled: true,
    priority: 100,
    timeout: 10000,
    maxConcurrent: 3,
    ...overrides,
  }
}

export function createProviderManifest(overrides: Partial<ProviderManifest> = {}): ProviderManifest {
  const n = seq()
  return {
    id: `plugin-${n}`,
    name: `Test Plugin ${n}`,
    version: '1.0.0',
    author: 'LH-TV Tests',
    description: `Test plugin ${n}`,
    priority: 100,
    entry: 'index.ts',
    ...overrides,
  }
}

// ============================================================
// User Data 相关
// ============================================================

export function createFavoriteMedia(overrides: Partial<FavoriteMedia> = {}): FavoriteMedia {
  const n = seq()
  return {
    id: `fav-${n}`,
    mediaId: `media-${n}`,
    providerId: 'test-provider',
    title: `Favorite ${n}`,
    cover: `https://example.com/cover-${n}.jpg`,
    description: `Description ${n}`,
    category: 'movie',
    favoritedAt: Date.now() - n * 10000,
    ...overrides,
  }
}

export function createWatchHistoryItem(overrides: Partial<WatchHistoryItem> = {}): WatchHistoryItem {
  const n = seq()
  return {
    id: `hist-${n}`,
    mediaId: `media-${n}`,
    episodeId: `ep-${n}`,
    providerId: 'test-provider',
    title: `History ${n}`,
    cover: `https://example.com/cover-${n}.jpg`,
    episodeLabel: `第${String(n).padStart(2, '0')}集`,
    duration: 2400,
    currentTime: 600,
    progress: 0.25,
    lastWatchedAt: Date.now() - n * 10000,
    ...overrides,
  }
}

export function createPlaybackPosition(mediaId: string, episodeId: string, time = 600): Record<string, unknown> {
  return {
    [`${mediaId}:${episodeId}`]: { mediaId, episodeId, currentTime: time, updatedAt: Date.now() },
  }
}

// ============================================================
// Download 相关
// ============================================================

export function createDownloadTask(overrides: Partial<DownloadTask> = {}): DownloadTask {
  const n = seq()
  return {
    id: `dl-${n}`,
    mediaId: `media-${n}`,
    providerId: 'test-provider',
    providerName: 'Test Provider',
    episodeId: `ep-${n}`,
    episodeLabel: `第${String(n).padStart(2, '0')}集`,
    episodeNum: n,
    title: `Download Show ${n}`,
    cover: `https://example.com/cover-${n}.jpg`,
    sourceUrl: `https://example.com/video-${n}.mp4`,
    status: 'pending',
    progress: 0,
    speed: 0,
    downloadedBytes: 0,
    totalBytes: 0,
    supportsResume: true,
    resumeCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}

// ============================================================
// Offline 相关
// ============================================================

export function createOfflineMedia(overrides: Partial<OfflineMedia> = {}): OfflineMedia {
  const n = seq()
  return {
    id: `offline-${n}`,
    mediaId: `media-${n}`,
    providerId: 'test-provider',
    title: `Offline Show ${n}`,
    cover: `https://example.com/cover-${n}.jpg`,
    episodeId: `ep-${n}`,
    episodeLabel: `第${String(n).padStart(2, '0')}集`,
    episodeNum: n,
    localFilePath: `C:\\downloads\\video-${n}.mp4`,
    fileSize: 100 * 1024 * 1024,
    downloadedAt: Date.now(),
    ...overrides,
  }
}

// ============================================================
// Aggregation 相关
// ============================================================

export function createAggregatedSearchResult(overrides: Partial<AggregatedSearchResult> = {}): AggregatedSearchResult {
  return {
    items: [createMediaItem(), createMediaItem()],
    providers: ['test-provider'],
    totalFromCache: 0,
    totalFromNetwork: 2,
    ...overrides,
  }
}

// ============================================================
// StorageSchema 相关
// ============================================================

export function createStorageSchema(overrides: Partial<StorageSchema> = {}): StorageSchema {
  return {
    favorites: [],
    history: [],
    playbackPositions: {},
    searchHistory: [],
    settings: {},
    offlineLibrary: [],
    downloadHistory: [],
    ...overrides,
  }
}
