// provider-contracts/interfaces/IMetadataProvider.ts — Content Ecosystem CE1
// Read-only metadata provider interface (TMDB, Bangumi, TVMaze)
// No playback URLs. Rich structured data.

import type { MediaItem, MediaDetail } from '../types/media.types'
import type { Person, Season, ContentRating, ExternalIds } from '../types/metadata.types'

export interface IMetadataProvider {
  // ─── Identity ───
  readonly id: string
  readonly name: string
  enabled: boolean
  priority: number

  // ─── Core (compatible with AggregationEngine via adapter) ───
  search(keyword: string): Promise<MediaItem[]>

  // ─── Rich Detail ───
  getMovie(id: string): Promise<MovieDetail>
  getSeries(id: string): Promise<SeriesDetail>
  getSeason(seriesId: string, seasonNumber: number): Promise<SeasonDetail>
  getEpisode(seriesId: string, seasonNumber: number, episodeNumber: number): Promise<EpisodeDetail>
  getPerson(id: string): Promise<Person>

  // ─── Discovery ───
  getTrending(mediaType?: 'movie' | 'tv'): Promise<MediaItem[]>
  getPopular(mediaType?: 'movie' | 'tv'): Promise<MediaItem[]>
  getRecommendations(id: string, mediaType: 'movie' | 'tv'): Promise<MediaItem[]>

  // ─── Health ───
  healthCheck(): Promise<boolean>
}

// ─── Detail Types ───

export interface MovieDetail extends MediaDetail {
  type: 'movie'
  backdrop: string
  poster: string
  releaseDate: string
  runtime: number             // minutes
  genres: string[]
  overview: string
  tagline: string
  rating: ContentRating
  cast: Person[]
  crew: Person[]
  similar: MediaItem[]
  externalIds: ExternalIds
}

export interface SeriesDetail extends MediaDetail {
  type: 'tv' | 'anime'
  backdrop: string
  poster: string
  firstAirDate: string
  lastAirDate: string
  status: string              // "Returning Series", "Ended", etc.
  genres: string[]
  overview: string
  rating: ContentRating
  seasons: Season[]
  cast: Person[]
  crew: Person[]
  externalIds: ExternalIds
  nextEpisode?: {
    airDate: string
    seasonNumber: number
    episodeNumber: number
    name: string
  }
}

export interface SeasonDetail {
  id: string
  seriesId: string
  name: string
  seasonNumber: number
  episodeCount: number
  poster: string
  overview: string
  airDate: string
  episodes: EpisodeDetail[]
}

export interface EpisodeDetail {
  id: string
  name: string
  episodeNumber: number
  seasonNumber: number
  overview: string
  still: string
  airDate: string
  runtime: number
  rating: ContentRating
}
