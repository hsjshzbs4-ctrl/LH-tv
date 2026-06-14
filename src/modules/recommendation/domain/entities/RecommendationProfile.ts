// modules/recommendation/domain/entities/RecommendationProfile.ts — CE9-A
// User preference profile for recommendation personalization.
// Built from favorites, watch history, search analytics.

/**
 * Genre preference: a genre with weight, frequency, and recency information.
 * Defined as a simple interface since it has no complex validation.
 */
export interface GenrePreference {
  readonly genre: string
  readonly weight: number
  readonly frequency: number
  readonly lastSeen: number
}

/**
 * Person (cast/crew) preference.
 */
export interface PersonPreference {
  readonly personId: string
  readonly name: string
  readonly job?: string
  readonly weight: number
  readonly frequency: number
}

/**
 * Content type distribution.
 */
export interface ContentTypePreference {
  readonly movieRatio: number
  readonly tvRatio: number
  readonly animeRatio: number
}

export interface YearPreference {
  readonly year: number
  readonly weight: number
}

export interface RecommendationProfileProps {
  readonly generatedAt: number
  readonly genrePreferences: GenrePreference[]
  readonly personPreferences: PersonPreference[]
  readonly contentTypePreference: ContentTypePreference
  readonly preferredYears: YearPreference[]
  readonly favoriteMediaIds: string[]
  readonly historyMediaIds: string[]
  readonly dataPoints: number
}

export class RecommendationProfile {
  readonly generatedAt: number
  readonly genrePreferences: readonly GenrePreference[]
  readonly personPreferences: readonly PersonPreference[]
  readonly contentTypePreference: ContentTypePreference
  readonly preferredYears: readonly YearPreference[]
  readonly favoriteMediaIds: readonly string[]
  readonly historyMediaIds: readonly string[]
  readonly dataPoints: number

  private constructor(props: RecommendationProfileProps) {
    if (props.generatedAt <= 0) {
      throw new Error('RecommendationProfile: generatedAt must be positive timestamp')
    }

    this.generatedAt = props.generatedAt
    this.genrePreferences = Object.freeze([...props.genrePreferences])
    this.personPreferences = Object.freeze([...props.personPreferences])
    this.contentTypePreference = props.contentTypePreference
    this.preferredYears = Object.freeze([...props.preferredYears])
    this.favoriteMediaIds = Object.freeze([...props.favoriteMediaIds])
    this.historyMediaIds = Object.freeze([...props.historyMediaIds])
    this.dataPoints = props.dataPoints
  }

  static create(props: RecommendationProfileProps): RecommendationProfile {
    return new RecommendationProfile(props)
  }

  /** Empty profile for cold start / new users */
  static empty(): RecommendationProfile {
    return new RecommendationProfile({
      generatedAt: Date.now(),
      genrePreferences: [],
      personPreferences: [],
      contentTypePreference: { movieRatio: 0.33, tvRatio: 0.34, animeRatio: 0.33 },
      preferredYears: [],
      favoriteMediaIds: [],
      historyMediaIds: [],
      dataPoints: 0,
    })
  }

  // ─── Queries ───

  getTopGenres(n: number): GenrePreference[] {
    return [...this.genrePreferences]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, n)
  }

  getTopPersons(n: number): PersonPreference[] {
    return [...this.personPreferences]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, n)
  }

  get dominantType(): 'movie' | 'tv' | 'anime' {
    const { movieRatio, tvRatio, animeRatio } = this.contentTypePreference
    if (movieRatio >= tvRatio && movieRatio >= animeRatio) return 'movie'
    if (tvRatio >= movieRatio && tvRatio >= animeRatio) return 'tv'
    return 'anime'
  }

  /** Has enough data for meaningful personalization? */
  get isPersonalized(): boolean {
    return this.dataPoints >= 3
  }

  /** Is the profile stale? */
  isStale(maxAgeMs: number = 24 * 60 * 60 * 1000): boolean {
    return Date.now() - this.generatedAt > maxAgeMs
  }

  /** Check if user has any interaction with a specific mediaId */
  hasInteractedWith(mediaId: string): boolean {
    return this.favoriteMediaIds.includes(mediaId)
      || this.historyMediaIds.includes(mediaId)
  }

  /** Preferred genre names (sorted by weight) */
  get preferredGenres(): string[] {
    return this.getTopGenres(10).map(g => g.genre)
  }

  /** Preferred content types */
  get preferredTypes(): ('movie' | 'tv' | 'anime')[] {
    const types: ('movie' | 'tv' | 'anime')[] = []
    const { movieRatio, tvRatio, animeRatio } = this.contentTypePreference
    if (movieRatio > 0.15) types.push('movie')
    if (tvRatio > 0.15) types.push('tv')
    if (animeRatio > 0.15) types.push('anime')
    return types
  }
}
