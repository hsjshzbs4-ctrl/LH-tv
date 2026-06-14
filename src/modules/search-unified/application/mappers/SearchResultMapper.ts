// modules/search-unified/application/mappers/SearchResultMapper.ts — CE8-B
// Maps domain entities → DTOs. No entity leakage — only primitives/plain objects.

import type { UnifiedSearchResult } from '../../domain/entities/UnifiedSearchResult'
import type { SearchSource } from '../../domain/entities/SearchSource'
import type { AvailabilityInfo } from '../../domain/entities/AvailabilityInfo'
import type {
  UnifiedSearchItemDto,
  SourceInfoDto,
  AvailabilityDto,
} from '../dto/UnifiedSearchItemDto'

export class SearchResultMapper {
  /** Map a single domain result to DTO. */
  toDto(result: UnifiedSearchResult): UnifiedSearchItemDto {
    return {
      contentId: result.contentId.value,
      title: result.title,
      originalTitle: result.originalTitle,
      mediaType: result.mediaType,
      overview: result.overview,
      poster: result.poster,
      backdrop: result.backdrop,
      year: result.year,
      score: result.score.value,
      genres: [...result.genres],
      sources: result.sources.map(s => this._sourceToDto(s)),
      availability: this._availabilityToDto(result.availability),
      sourceCount: result.sourceCount,
      isPlayable: result.isPlayable,
    }
  }

  /** Map multiple results to DTOs. */
  toDtoList(results: UnifiedSearchResult[]): UnifiedSearchItemDto[] {
    return results.map(r => this.toDto(r))
  }

  private _sourceToDto(source: SearchSource): SourceInfoDto {
    return {
      sourceId: source.sourceId,
      sourceType: source.sourceType,
      available: source.available,
      quality: source.quality,
    }
  }

  private _availabilityToDto(info: AvailabilityInfo): AvailabilityDto {
    return {
      playable: info.playable,
      preferredSourceType: info.preferredSourceType,
      sourceCount: info.availableSources.length,
      bestQuality: info.bestQuality,
      localAvailable: info.localAvailable,
    }
  }
}
