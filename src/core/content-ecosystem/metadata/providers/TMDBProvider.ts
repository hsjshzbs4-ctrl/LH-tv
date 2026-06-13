// core/content-ecosystem/metadata/providers/TMDBProvider.ts — CE3
// TMDB (The Movie Database) metadata provider — api.themoviedb.org/v3
// API key injected via constructor (from Electron secrets in prod, env var in test)

import { BaseMetadataProvider } from '../base/BaseMetadataProvider'
import { RATE_LIMITS } from '../../utils/RateLimiter'
import { METADATA_TTL } from '../../utils/MetadataCache'
import type {
  MediaItem, MovieDetail, SeriesDetail, SeasonDetail, EpisodeDetail,
  Person, ContentRating,
} from '@provider-contracts'

const BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

export class TMDBProvider extends BaseMetadataProvider {
  readonly id = 'tmdb'
  readonly name = 'TMDB'
  readonly priority = 10

  constructor(private apiKey: string) {
    super(RATE_LIMITS.TMDB)
  }

  // ─── Search ───
  async search(keyword: string): Promise<MediaItem[]> {
    return this.cachedFetch('tmdb', `search:${keyword}`, async () => {
      const data = await this.rateLimitFetch<{ results: any[] }>(
        `${BASE_URL}/search/multi?api_key=${this.apiKey}&query=${encodeURIComponent(keyword)}&language=zh-CN`
      )
      return data.results
        .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
        .map(r => this._mapSearchResult(r))
    }, METADATA_TTL.search)
  }

  // ─── Movie Detail ───
  async getMovie(id: string): Promise<MovieDetail> {
    return this.cachedFetch('tmdb', `movie:${id}`, async () => {
      const [detail, credits, similar] = await Promise.all([
        this.rateLimitFetch<any>(`${BASE_URL}/movie/${id}?api_key=${this.apiKey}&language=zh-CN`),
        this.rateLimitFetch<any>(`${BASE_URL}/movie/${id}/credits?api_key=${this.apiKey}`),
        this.rateLimitFetch<any>(`${BASE_URL}/movie/${id}/similar?api_key=${this.apiKey}&language=zh-CN`),
      ])
      return this._mapMovieDetail(detail, credits, similar)
    }, METADATA_TTL.detail)
  }

  // ─── Series Detail ───
  async getSeries(id: string): Promise<SeriesDetail> {
    return this.cachedFetch('tmdb', `series:${id}`, async () => {
      const [detail, credits] = await Promise.all([
        this.rateLimitFetch<any>(`${BASE_URL}/tv/${id}?api_key=${this.apiKey}&language=zh-CN`),
        this.rateLimitFetch<any>(`${BASE_URL}/tv/${id}/credits?api_key=${this.apiKey}`),
      ])
      return this._mapSeriesDetail(detail, credits)
    }, METADATA_TTL.detail)
  }

  // ─── Season Detail ───
  async getSeason(seriesId: string, seasonNumber: number): Promise<SeasonDetail> {
    return this.cachedFetch('tmdb', `season:${seriesId}:${seasonNumber}`, async () => {
      const data = await this.rateLimitFetch<any>(
        `${BASE_URL}/tv/${seriesId}/season/${seasonNumber}?api_key=${this.apiKey}&language=zh-CN`
      )
      return this._mapSeasonDetail(data, seriesId)
    }, METADATA_TTL.detail)
  }

  // ─── Episode Detail ───
  async getEpisode(
    seriesId: string, seasonNumber: number, episodeNumber: number
  ): Promise<EpisodeDetail> {
    return this.cachedFetch('tmdb', `episode:${seriesId}:${seasonNumber}:${episodeNumber}`, async () => {
      const data = await this.rateLimitFetch<any>(
        `${BASE_URL}/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}?api_key=${this.apiKey}&language=zh-CN`
      )
      return this._mapEpisodeDetail(data, seasonNumber)
    }, METADATA_TTL.detail)
  }

  // ─── Person ───
  async getPerson(id: string): Promise<Person> {
    return this.cachedFetch('tmdb', `person:${id}`, async () => {
      const data = await this.rateLimitFetch<any>(
        `${BASE_URL}/person/${id}?api_key=${this.apiKey}&language=zh-CN`
      )
      return {
        id: String(data.id),
        name: data.name,
        profile: data.profile_path ? `${IMAGE_BASE}${data.profile_path}` : '',
        job: data.known_for_department,
      }
    }, METADATA_TTL.person)
  }

  // ─── Discovery ───
  async getTrending(mediaType: 'movie' | 'tv' = 'movie'): Promise<MediaItem[]> {
    return this.cachedFetch('tmdb', `trending:${mediaType}`, async () => {
      const data = await this.rateLimitFetch<{ results: any[] }>(
        `${BASE_URL}/trending/${mediaType}/week?api_key=${this.apiKey}&language=zh-CN`
      )
      return data.results.slice(0, 20).map(r => this._mapSearchResult({ ...r, media_type: mediaType }))
    }, METADATA_TTL.trending)
  }

  async getPopular(mediaType: 'movie' | 'tv' = 'movie'): Promise<MediaItem[]> {
    return this.cachedFetch('tmdb', `popular:${mediaType}`, async () => {
      const data = await this.rateLimitFetch<{ results: any[] }>(
        `${BASE_URL}/${mediaType}/popular?api_key=${this.apiKey}&language=zh-CN`
      )
      return data.results.slice(0, 20).map(r => this._mapSearchResult({ ...r, media_type: mediaType }))
    }, METADATA_TTL.trending)
  }

  async getRecommendations(id: string, mediaType: 'movie' | 'tv'): Promise<MediaItem[]> {
    return this.cachedFetch('tmdb', `recommend:${id}:${mediaType}`, async () => {
      const data = await this.rateLimitFetch<{ results: any[] }>(
        `${BASE_URL}/${mediaType}/${id}/recommendations?api_key=${this.apiKey}&language=zh-CN`
      )
      return data.results.slice(0, 10).map(r => this._mapSearchResult({ ...r, media_type: mediaType }))
    }, METADATA_TTL.search)
  }

  // ─── Internal Mappers ───

  private _mapSearchResult(raw: any): MediaItem {
    const isMovie = raw.media_type === 'movie'
    return {
      id: String(raw.id),
      title: isMovie ? raw.title : raw.name,
      cover: raw.poster_path ? `${IMAGE_BASE}${raw.poster_path}` : '',
      providerId: this.id,
      providerName: this.name,
      type: isMovie ? 'movie' : 'tv',
      year: raw.release_date ? parseInt(raw.release_date.substring(0, 4)) : undefined,
      score: raw.vote_average,
      remark: raw.overview?.substring(0, 100),
    }
  }

  private _mapMovieDetail(detail: any, credits: any, similar: any): MovieDetail {
    return {
      id: String(detail.id),
      title: detail.title,
      cover: detail.poster_path ? `${IMAGE_BASE}${detail.poster_path}` : '',
      providerId: this.id,
      description: detail.overview || '',
      type: 'movie',
      backdrop: detail.backdrop_path ? `https://image.tmdb.org/t/p/original${detail.backdrop_path}` : '',
      poster: detail.poster_path ? `${IMAGE_BASE}${detail.poster_path}` : '',
      releaseDate: detail.release_date || '',
      runtime: detail.runtime || 0,
      genres: (detail.genres || []).map((g: any) => g.name),
      overview: detail.overview || '',
      tagline: detail.tagline || '',
      rating: { average: detail.vote_average || 0, count: detail.vote_count || 0 },
      cast: (credits.cast || []).slice(0, 20).map((c: any) => ({
        id: String(c.id), name: c.name, character: c.character,
        profile: c.profile_path ? `${IMAGE_BASE}${c.profile_path}` : '', order: c.order,
      })),
      crew: (credits.crew || []).slice(0, 10).map((c: any) => ({
        id: String(c.id), name: c.name, job: c.job,
        profile: c.profile_path ? `${IMAGE_BASE}${c.profile_path}` : '',
      })),
      similar: (similar.results || []).slice(0, 10).map((s: any) =>
        this._mapSearchResult({ ...s, media_type: 'movie' })),
      externalIds: { tmdb: detail.id, imdb: detail.imdb_id },
      episodes: [], // movies have no episodes
    }
  }

  private _mapSeriesDetail(detail: any, credits: any): SeriesDetail {
    return {
      id: String(detail.id),
      title: detail.name,
      cover: detail.poster_path ? `${IMAGE_BASE}${detail.poster_path}` : '',
      providerId: this.id,
      description: detail.overview || '',
      type: 'tv',
      backdrop: detail.backdrop_path ? `https://image.tmdb.org/t/p/original${detail.backdrop_path}` : '',
      poster: detail.poster_path ? `${IMAGE_BASE}${detail.poster_path}` : '',
      firstAirDate: detail.first_air_date || '',
      lastAirDate: detail.last_air_date || '',
      status: detail.status || '',
      genres: (detail.genres || []).map((g: any) => g.name),
      overview: detail.overview || '',
      rating: { average: detail.vote_average || 0, count: detail.vote_count || 0 },
      seasons: (detail.seasons || []).map((s: any) => ({
        id: String(s.id), name: s.name, seasonNumber: s.season_number,
        episodeCount: s.episode_count, poster: s.poster_path ? `${IMAGE_BASE}${s.poster_path}` : '',
        overview: s.overview || '', airDate: s.air_date || '',
      })),
      cast: (credits.cast || []).slice(0, 20).map((c: any) => ({
        id: String(c.id), name: c.name, character: c.character,
        profile: c.profile_path ? `${IMAGE_BASE}${c.profile_path}` : '', order: c.order,
      })),
      crew: (credits.crew || []).slice(0, 10).map((c: any) => ({
        id: String(c.id), name: c.name, job: c.job,
        profile: c.profile_path ? `${IMAGE_BASE}${c.profile_path}` : '',
      })),
      externalIds: { tmdb: detail.id },
      episodes: [],
      nextEpisode: detail.next_episode_to_air ? {
        airDate: detail.next_episode_to_air.air_date || '',
        seasonNumber: detail.next_episode_to_air.season_number,
        episodeNumber: detail.next_episode_to_air.episode_number,
        name: detail.next_episode_to_air.name || '',
      } : undefined,
    }
  }

  private _mapSeasonDetail(data: any, seriesId: string): SeasonDetail {
    return {
      id: String(data.id),
      seriesId,
      name: data.name,
      seasonNumber: data.season_number,
      episodeCount: data.episodes?.length || 0,
      poster: data.poster_path ? `${IMAGE_BASE}${data.poster_path}` : '',
      overview: data.overview || '',
      airDate: data.air_date || '',
      episodes: (data.episodes || []).map((e: any) => this._mapEpisodeDetail(e, data.season_number)),
    }
  }

  private _mapEpisodeDetail(data: any, seasonNumber: number): EpisodeDetail & { title: string } {
    const epName = data.name || `Episode ${data.episode_number}`
    return {
      id: String(data.id),
      name: epName,
      title: epName,
      episodeNumber: data.episode_number,
      seasonNumber,
      overview: data.overview || '',
      still: data.still_path ? `${IMAGE_BASE}${data.still_path}` : '',
      airDate: data.air_date || '',
      runtime: data.runtime || 0,
      rating: { average: data.vote_average || 0, count: data.vote_count || 0 },
    }
  }
}
