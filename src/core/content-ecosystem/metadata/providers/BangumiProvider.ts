// core/content-ecosystem/metadata/providers/BangumiProvider.ts — CE3
// Bangumi (bgm.tv) anime metadata provider — api.bgm.tv/v0
// Open API — no key required

import { BaseMetadataProvider } from '../base/BaseMetadataProvider'
import { RATE_LIMITS } from '../../utils/RateLimiter'
import { METADATA_TTL } from '../../utils/MetadataCache'
import type {
  MediaItem, MovieDetail, SeriesDetail, SeasonDetail, EpisodeDetail, Person,
} from '@provider-contracts'

const BASE_URL = 'https://api.bgm.tv/v0'

export class BangumiProvider extends BaseMetadataProvider {
  readonly id = 'bangumi'
  readonly name = 'Bangumi'
  readonly priority = 11

  constructor() {
    super(RATE_LIMITS.BANGUMI)
  }

  // ─── Search ───
  async search(keyword: string): Promise<MediaItem[]> {
    return this.cachedFetch('bangumi', `search:${keyword}`, async () => {
      const data = await this.rateLimitFetch<{ data: any[] }>(
        `${BASE_URL}/search/subject/${encodeURIComponent(keyword)}?type=2&limit=20`
      )
      if (!data.data) return []
      return data.data.map((s: any) => this._mapSubject(s))
    }, METADATA_TTL.search)
  }

  // ─── Detail (Bangumi "subjects" map to anime series) ───
  async getMovie(id: string): Promise<MovieDetail> {
    // Bangumi doesn't have movies — treat as anime series
    const series = await this.getSeries(id)
    return series as unknown as MovieDetail
  }

  async getSeries(id: string): Promise<SeriesDetail> {
    return this.cachedFetch('bangumi', `series:${id}`, async () => {
      const [detail, persons, episodes] = await Promise.all([
        this.rateLimitFetch<any>(`${BASE_URL}/subjects/${id}`),
        this.rateLimitFetch<any>(`${BASE_URL}/subjects/${id}/persons`).catch(() => []),
        this.rateLimitFetch<any>(`${BASE_URL}/subjects/${id}/episodes?limit=100`).catch(() => ({ data: [] })),
      ])
      return this._mapSubjectDetail(detail, persons, episodes.data || [])
    }, METADATA_TTL.detail)
  }

  async getSeason(seriesId: string, seasonNumber: number): Promise<SeasonDetail> {
    // Bangumi flattens seasons — filter episodes by type
    const detail = await this.getSeries(seriesId)
    const seasonEpisodes = detail.episodes
    return {
      id: `${seriesId}-s${seasonNumber}`,
      seriesId,
      name: `Season ${seasonNumber}`,
      seasonNumber,
      episodeCount: seasonEpisodes.length,
      poster: detail.poster,
      overview: detail.overview,
      airDate: detail.firstAirDate,
      episodes: seasonEpisodes as unknown as EpisodeDetail[],
    }
  }

  async getEpisode(
    seriesId: string, _seasonNumber: number, episodeNumber: number
  ): Promise<EpisodeDetail> {
    const data = await this.rateLimitFetch<any>(
      `${BASE_URL}/subjects/${seriesId}/episodes?limit=100`
    )
    const ep = (data.data || []).find((e: any) => e.sort === episodeNumber || e.ep === episodeNumber)
    if (!ep) throw new Error(`Episode ${episodeNumber} not found`)
    return this._mapEpisode(ep)
  }

  async getPerson(id: string): Promise<Person> {
    return this.cachedFetch('bangumi', `person:${id}`, async () => {
      const data = await this.rateLimitFetch<any>(`${BASE_URL}/persons/${id}`)
      return {
        id: String(data.id),
        name: data.name,
        profile: data.images?.large || data.images?.medium || '',
        job: data.career?.[0] || '',
      }
    }, METADATA_TTL.person)
  }

  // ─── Discovery ───
  async getTrending(): Promise<MediaItem[]> {
    return this.cachedFetch('bangumi', 'trending', async () => {
      const data = await this.rateLimitFetch<{ data: any[] }>(
        `${BASE_URL}/subjects?type=2&sort=rank&limit=20`
      )
      return (data.data || []).map((s: any) => this._mapSubject(s))
    }, METADATA_TTL.trending)
  }

  async getPopular(): Promise<MediaItem[]> {
    return this.cachedFetch('bangumi', 'popular', async () => {
      const data = await this.rateLimitFetch<{ data: any[] }>(
        `${BASE_URL}/subjects?type=2&sort=heat&limit=20`
      )
      return (data.data || []).map((s: any) => this._mapSubject(s))
    }, METADATA_TTL.trending)
  }

  async getRecommendations(id: string, _mediaType: 'movie' | 'tv'): Promise<MediaItem[]> {
    // Bangumi: related subjects
    return this.cachedFetch('bangumi', `recommend:${id}`, async () => {
      const data = await this.rateLimitFetch<any[]>(
        `${BASE_URL}/subjects/${id}/subjects`
      )
      return (data || []).slice(0, 10).map((s: any) => this._mapSubject(s))
    }, METADATA_TTL.search)
  }

  // ─── Internal Mappers ───

  private _mapSubject(raw: any): MediaItem {
    return {
      id: String(raw.id),
      title: raw.name_cn || raw.name,
      cover: raw.images?.large || raw.images?.medium || '',
      providerId: this.id,
      providerName: this.name,
      type: 'anime',
      year: raw.date ? parseInt(raw.date.substring(0, 4)) : undefined,
      score: raw.rating?.score || raw.score,
      remark: raw.summary?.substring(0, 100),
    }
  }

  private _mapSubjectDetail(detail: any, persons: any[], episodes: any[]): SeriesDetail {
    return {
      id: String(detail.id),
      title: detail.name_cn || detail.name,
      cover: detail.images?.large || detail.images?.medium || '',
      providerId: this.id,
      description: detail.summary || '',
      type: 'anime',
      backdrop: detail.images?.large || '',
      poster: detail.images?.large || '',
      firstAirDate: detail.date || '',
      lastAirDate: detail.date || '',
      status: detail.air_date ? 'Aired' : 'Unknown',
      genres: (detail.tags || []).map((t: any) => t.name),
      overview: detail.summary || '',
      rating: {
        average: detail.rating?.score || 0,
        count: detail.rating?.total || 0,
      },
      seasons: [{ id: `${detail.id}-s1`, name: 'Main', seasonNumber: 1, episodeCount: episodes.length, poster: '', overview: '', airDate: detail.date || '' }],
      cast: (Array.isArray(persons) ? persons : []).slice(0, 20).map((p: any) => ({
        id: String(p.id), name: p.name, character: p.relation || '',
        profile: p.images?.large || '', order: 0,
      })),
      crew: [],
      externalIds: { bangumi: detail.id },
      episodes: episodes.map((e: any) => this._mapEpisode(e)),
    }
  }

  private _mapEpisode(raw: any): EpisodeDetail & { title: string } {
    const epName = raw.name_cn || raw.name || `Episode ${raw.sort || raw.ep}`
    return {
      id: String(raw.id),
      name: epName,
      title: epName,
      episodeNumber: raw.sort || raw.ep || 0,
      seasonNumber: 1,
      overview: raw.desc || '',
      still: '',
      airDate: raw.airdate || '',
      runtime: raw.duration ? parseInt(raw.duration.replace('min', '')) : 0,
      rating: { average: 0, count: 0 },
    }
  }
}
