// modules/recommendation/application/mappers/ProfileMapper.ts — CE9-B
// RecommendationProfile entity ↔ serializable DTO mapping.
// No business behavior. Pure data transformation.

import { RecommendationProfile } from '../../domain/entities/RecommendationProfile'
import type {
  GenrePreference,
  PersonPreference,
  ContentTypePreference,
  YearPreference,
} from '../../domain/entities/RecommendationProfile'

/** Serializable profile DTO */
export interface ProfileDto {
  readonly generatedAt: number
  readonly genrePreferences: GenrePreferenceDto[]
  readonly personPreferences: PersonPreferenceDto[]
  readonly contentTypePreference: ContentTypePreferenceDto
  readonly preferredYears: YearPreferenceDto[]
  readonly favoriteMediaIds: string[]
  readonly historyMediaIds: string[]
  readonly dataPoints: number
}

export interface GenrePreferenceDto {
  readonly genre: string
  readonly weight: number
  readonly frequency: number
}

export interface PersonPreferenceDto {
  readonly personId: string
  readonly name: string
  readonly job?: string
  readonly weight: number
  readonly frequency: number
}

export interface ContentTypePreferenceDto {
  readonly movieRatio: number
  readonly tvRatio: number
  readonly animeRatio: number
}

export interface YearPreferenceDto {
  readonly year: number
  readonly weight: number
}

export class ProfileMapper {
  /** Domain entity → DTO */
  static toDto(profile: RecommendationProfile): ProfileDto {
    return {
      generatedAt: profile.generatedAt,
      genrePreferences: profile.genrePreferences.map(g => ({
        genre: g.genre,
        weight: g.weight,
        frequency: g.frequency,
      })),
      personPreferences: profile.personPreferences.map(p => ({
        personId: p.personId,
        name: p.name,
        job: p.job,
        weight: p.weight,
        frequency: p.frequency,
      })),
      contentTypePreference: {
        movieRatio: profile.contentTypePreference.movieRatio,
        tvRatio: profile.contentTypePreference.tvRatio,
        animeRatio: profile.contentTypePreference.animeRatio,
      },
      preferredYears: profile.preferredYears.map(y => ({
        year: y.year,
        weight: y.weight,
      })),
      favoriteMediaIds: [...profile.favoriteMediaIds],
      historyMediaIds: [...profile.historyMediaIds],
      dataPoints: profile.dataPoints,
    }
  }

  /** DTO → Domain entity */
  static toDomain(dto: ProfileDto): RecommendationProfile {
    return RecommendationProfile.create({
      generatedAt: dto.generatedAt,
      genrePreferences: dto.genrePreferences as GenrePreference[],
      personPreferences: dto.personPreferences as PersonPreference[],
      contentTypePreference: dto.contentTypePreference as ContentTypePreference,
      preferredYears: dto.preferredYears as YearPreference[],
      favoriteMediaIds: dto.favoriteMediaIds,
      historyMediaIds: dto.historyMediaIds,
      dataPoints: dto.dataPoints,
    })
  }
}
