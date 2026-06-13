// core/content-ecosystem/metadata/base/BaseMetadataProvider.ts — CE3
// Abstract base for metadata providers (TMDB, Bangumi, TVMaze)
// Provides: RateLimiter, caching, fetch, retry, logging

import type { IMetadataProvider, MediaItem } from '@provider-contracts'
import type {
  MovieDetail, SeriesDetail, SeasonDetail, EpisodeDetail,
  Person, RateLimitConfig,
} from '@provider-contracts'
import { RateLimiter } from '../../utils/RateLimiter'
import { metadataCache, METADATA_TTL } from '../../utils/MetadataCache'

export abstract class BaseMetadataProvider implements IMetadataProvider {
  abstract readonly id: string
  abstract readonly name: string
  abstract readonly priority: number
  enabled = true

  protected rateLimiter: RateLimiter
  protected timeout = 10000
  protected maxRetries = 3

  constructor(rateLimitConfig: RateLimitConfig) {
    this.rateLimiter = new RateLimiter(rateLimitConfig)
  }

  // ─── Abstract ───
  abstract search(keyword: string): Promise<MediaItem[]>
  abstract getMovie(id: string): Promise<MovieDetail>
  abstract getSeries(id: string): Promise<SeriesDetail>
  abstract getSeason(seriesId: string, seasonNumber: number): Promise<SeasonDetail>
  abstract getEpisode(
    seriesId: string, seasonNumber: number, episodeNumber: number
  ): Promise<EpisodeDetail>
  abstract getPerson(id: string): Promise<Person>
  abstract getTrending(mediaType?: 'movie' | 'tv'): Promise<MediaItem[]>
  abstract getPopular(mediaType?: 'movie' | 'tv'): Promise<MediaItem[]>
  abstract getRecommendations(id: string, mediaType: 'movie' | 'tv'): Promise<MediaItem[]>

  // ─── Health ───
  async healthCheck(): Promise<boolean> {
    try {
      const results = await this.getTrending('movie')
      return Array.isArray(results) && results.length > 0
    } catch {
      return false
    }
  }

  // ─── Protected Utilities ───

  protected async rateLimitFetch<T>(url: string, options?: RequestInit): Promise<T> {
    await this.rateLimiter.acquire()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json() as T
    } finally {
      clearTimeout(timer)
    }
  }

  protected async cachedFetch<T>(
    namespace: string,
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number
  ): Promise<T> {
    return metadataCache.wrap<T>(namespace, key, fetcher, ttlMs)
  }

  protected async retry<T>(fn: () => Promise<T>, retries = this.maxRetries): Promise<T> {
    let lastError: Error | undefined
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn()
      } catch (e) {
        lastError = e as Error
        if (i < retries) {
          await this.sleep(Math.pow(2, i) * 500) // exponential backoff
        }
      }
    }
    throw lastError!
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  protected log(message: string): void {
    console.log(`[${this.id}] ${message}`)
  }

  protected logError(message: string, error: unknown): void {
    console.error(`[${this.id}] ${message}`, error instanceof Error ? error.message : error)
  }
}
