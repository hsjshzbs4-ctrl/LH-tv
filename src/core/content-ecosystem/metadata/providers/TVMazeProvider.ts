// core/content-ecosystem/metadata/providers/TVMazeProvider.ts — CE3
// TVMaze Western TV show metadata provider — api.tvmaze.com
// Free API, no key required

import { BaseMetadataProvider } from '../base/BaseMetadataProvider'
import { RATE_LIMITS } from '../../utils/RateLimiter'
import { METADATA_TTL } from '../../utils/MetadataCache'
import type {
  MediaItem, MovieDetail, SeriesDetail, SeasonDetail, EpisodeDetail, Person,
} from '@provider-contracts'

const BASE_URL = 'https://api.tvmaze.com'

export class TVMazeProvider extends BaseMetadataProvider {
  readonly id = 'tvmaze'
  readonly name = 'TVMaze'
  readonly priority = 12

  constructor() {
    super(RATE_LIMITS.TVMAZE)
  }

  // ─── Search ───
  async search(keyword: string): Promise<MediaItem[]> {
    return this.cachedFetch('tvmaze', `search:${keyword}`, async () => {
      const data = await this.rateLimitFetch<Array<{ show: any }>>(
        `${BASE_URL}/search/shows?q=${encodeURIComponent(keyword)}`
      )
      return data.map(r => this._mapShow(r.show))
    }, METADATA_TTL.search)
  }

  // ─── Movie (not supported by TVMaze) ───
  async getMovie(_id: string): Promise<MovieDetail> {
    throw new Error('TVMaze does not support movies')
  }

  // ─── Series Detail ───
  async getSeries(id: string): Promise<SeriesDetail> {
    return this.cachedFetch('tvmaze', `series:${id}`, async () => {
      const [detail, cast, episodes] = await Promise.all([
        this.rateLimitFetch<any>(`${BASE_URL}/shows/${id}?embed[]=seasons&embed[]=nextepisode`),
        this.rateLimitFetch<any>(`${BASE_URL}/shows/${id}/cast`).catch(() => []),
        this.rateLimitFetch<any>(`${BASE_URL}/shows/${id}/episodes?specials=0`).catch(() => []),
      ])
      return this._mapShowDetail(detail, cast, episodes)
    }, METADATA_TTL.detail)
  }

  async getSeason(seriesId: string, seasonNumber: number): Promise<SeasonDetail> {
    const data = await this.rateLimitFetch<any>(
      `${BASE_URL}/shows/${seriesId}/episodes?season=${seasonNumber}`
    )
    const episodes = (Array.isArray(data) ? data : []).map((e: any) => this._mapEpisode(e))
    return {
      id: `${seriesId}-s${seasonNumber}`,
      seriesId,
      name: `Season ${seasonNumber}`,
      seasonNumber,
      episodeCount: episodes.length,
      poster: '',
      overview: '',
      airDate: episodes[0]?.airDate || '',
      episodes,
    }
  }

  async getEpisode(
    seriesId: string, seasonNumber: number, episodeNumber: number
  ): Promise<EpisodeDetail> {
    const data = await this.rateLimitFetch<any>(
      `${BASE_URL}/shows/${seriesId}/episodebynumber?season=${seasonNumber}&number=${episodeNumber}`
    )
    return this._mapEpisode(data)
  }

  async getPerson(id: string): Promise<Person> {
    return this.cachedFetch('tvmaze', `person:${id}`, async () => {
      const data = await this.rateLimitFetch<any>(`${BASE_URL}/people/${id}`)
      return {
        id: String(data.id),
        name: data.name,
        profile: data.image?.original || data.image?.medium || '',
        job: data.occupation || '',
      }
    }, METADATA_TTL.person)
  }

  // ─── Discovery ───
  async getTrending(): Promise<MediaItem[]> {
    return this.cachedFetch('tvmaze', 'schedule', async () => {
      const data = await this.rateLimitFetch<any[]>(
        `${BASE_URL}/schedule?country=US`
      )
      const shows = new Map<number, any>()
      for (const ep of data || []) {
        if (ep.show && !shows.has(ep.show.id)) {
          shows.set(ep.show.id, ep.show)
        }
      }
      return Array.from(shows.values()).slice(0, 20).map((ep: any) => this._mapShow(ep.show))
    }, METADATA_TTL.trending)
  }

  async getPopular(): Promise<MediaItem[]> {
    return this.cachedFetch('tvmaze', 'popular', async () => {
      const data = await this.rateLimitFetch<any[]>(
        `${BASE_URL}/shows?page=0`
      )
      return (data || []).slice(0, 20).map((s: any) => this._mapShow(s))
    }, METADATA_TTL.trending)
  }

  async getRecommendations(_id: string, _mediaType: 'movie' | 'tv'): Promise<MediaItem[]> {
    // TVMaze doesn't have a recommendation endpoint
    return []
  }

  // ─── Internal Mappers ───

  private _mapShow(raw: any): MediaItem {
    return {
      id: String(raw.id),
      title: raw.name,
      cover: raw.image?.medium || raw.image?.original || '',
      providerId: this.id,
      providerName: this.name,
      type: 'tv',
      year: raw.premiered ? parseInt(raw.premiered.substring(0, 4)) : undefined,
      score: raw.rating?.average,
      remark: raw.summary?.replace(/<[^>]*>/g, '').substring(0, 100),
    }
  }

  private _mapShowDetail(detail: any, cast: any[], episodes: any[]): SeriesDetail {
    return {
      id: String(detail.id),
      title: detail.name,
      cover: detail.image?.medium || '',
      providerId: this.id,
      description: (detail.summary || '').replace(/<[^>]*>/g, ''),
      type: 'tv',
      backdrop: detail.image?.original || '',
      poster: detail.image?.medium || '',
      firstAirDate: detail.premiered || '',
      lastAirDate: detail.ended || '',
      status: detail.status || '',
      genres: detail.genres || [],
      overview: (detail.summary || '').replace(/<[^>]*>/g, ''),
      rating: {
        average: detail.rating?.average || 0,
        count: detail.rating?.count || 0,
      },
      seasons: (detail._embedded?.seasons || []).map((s: any) => ({
        id: String(s.id), name: s.name || `Season ${s.number}`,
        seasonNumber: s.number, episodeCount: s.episodeOrder || 0,
        poster: s.image?.medium || '', overview: s.summary || '',
        airDate: s.premiereDate || '',
      })),
      cast: (Array.isArray(cast) ? cast : []).slice(0, 20).map((c: any) => ({
        id: String(c.person?.id || c.id), name: c.person?.name || c.name,
        character: c.character?.name || '',
        profile: c.person?.image?.medium || '', order: 0,
      })),
      crew: [],
      externalIds: {
        tvmaze: detail.id,
        imdb: detail.externals?.imdb || undefined,
      },
      episodes: (Array.isArray(episodes) ? episodes : []).map((e: any) => this._mapEpisode(e)),
    }
  }

  private _mapEpisode(raw: any): EpisodeDetail & { title: string } {
    const epName = raw.name || `Episode ${raw.number}`
    return {
      id: String(raw.id),
      name: epName,
      title: epName,
      episodeNumber: raw.number || 0,
      seasonNumber: raw.season || 0,
      overview: (raw.summary || '').replace(/<[^>]*>/g, ''),
      still: raw.image?.medium || raw.image?.original || '',
      airDate: raw.airdate || '',
      runtime: raw.runtime || 0,
      rating: { average: raw.rating?.average || 0, count: 0 },
    }
  }
}
