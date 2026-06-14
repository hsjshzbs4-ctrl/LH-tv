// modules/search-unified/domain/entities/AvailabilityInfo.ts — CE8-A
// Captures whether and how a unified search result is playable.
// Immutable — domain validation enforced at construction.

import { SearchSource } from './SearchSource'
import type { SourceType } from './SearchSource'

export interface AvailabilityInfoProps {
  readonly playable: boolean
  readonly preferredSource: SearchSource | null
  readonly availableSources: SearchSource[]
  readonly bestQuality: number
  readonly localAvailable: boolean
}

export class AvailabilityInfo {
  readonly playable: boolean
  readonly preferredSource: SearchSource | null
  readonly availableSources: SearchSource[]
  readonly bestQuality: number
  readonly localAvailable: boolean

  private constructor(props: AvailabilityInfoProps) {
    // Domain validation
    if (props.playable && !props.preferredSource) {
      throw new Error('AvailabilityInfo: playable=true requires a preferredSource')
    }
    if (props.playable && props.availableSources.length === 0) {
      throw new Error('AvailabilityInfo: playable=true requires at least one available source')
    }
    if (props.bestQuality < 0 || props.bestQuality > 100) {
      throw new Error('AvailabilityInfo: bestQuality must be 0-100')
    }
    if (props.localAvailable && !props.availableSources.some(s => s.sourceType === 'local')) {
      throw new Error('AvailabilityInfo: localAvailable=true requires a local source')
    }

    this.playable = props.playable
    this.preferredSource = props.preferredSource
    this.availableSources = [...props.availableSources]
    this.bestQuality = props.bestQuality
    this.localAvailable = props.localAvailable
  }

  static create(props: AvailabilityInfoProps): AvailabilityInfo {
    return new AvailabilityInfo(props)
  }

  static unavailable(): AvailabilityInfo {
    return new AvailabilityInfo({
      playable: false,
      preferredSource: null,
      availableSources: [],
      bestQuality: 0,
      localAvailable: false,
    })
  }

  get preferredSourceType(): SourceType | null {
    return this.preferredSource?.sourceType ?? null
  }
}
