// tests/unit/search-unified/availability-info.spec.ts — CE8-A AvailabilityInfo tests

import { describe, it, expect } from 'vitest'
import { AvailabilityInfo } from '@/modules/search-unified/domain/entities/AvailabilityInfo'
import { SearchSource } from '@/modules/search-unified/domain/entities/SearchSource'

function makeSource(overrides = {}) {
  return SearchSource.create({
    sourceId: 'local-1',
    sourceType: 'local',
    externalId: 'item-1',
    available: true,
    quality: 80,
    ...overrides,
  })
}

describe('AvailabilityInfo', () => {
  it('should create with valid props', () => {
    const src = makeSource()
    const info = AvailabilityInfo.create({
      playable: true,
      preferredSource: src,
      availableSources: [src],
      bestQuality: 80,
      localAvailable: true,
    })
    expect(info.playable).toBe(true)
    expect(info.preferredSource).toBe(src)
    expect(info.bestQuality).toBe(80)
    expect(info.localAvailable).toBe(true)
  })

  it('should create unavailable', () => {
    const info = AvailabilityInfo.unavailable()
    expect(info.playable).toBe(false)
    expect(info.preferredSource).toBeNull()
    expect(info.availableSources).toHaveLength(0)
    expect(info.bestQuality).toBe(0)
    expect(info.localAvailable).toBe(false)
  })

  it('should reject playable without preferred source', () => {
    expect(() =>
      AvailabilityInfo.create({
        playable: true,
        preferredSource: null,
        availableSources: [makeSource()],
        bestQuality: 80,
        localAvailable: true,
      }),
    ).toThrow('playable=true requires a preferredSource')
  })

  it('should reject playable without available sources', () => {
    const src = makeSource()
    expect(() =>
      AvailabilityInfo.create({
        playable: true,
        preferredSource: src,
        availableSources: [],
        bestQuality: 80,
        localAvailable: false,
      }),
    ).toThrow('playable=true requires at least one available source')
  })

  it('should reject invalid bestQuality', () => {
    expect(() =>
      AvailabilityInfo.create({
        playable: false,
        preferredSource: null,
        availableSources: [],
        bestQuality: 150,
        localAvailable: false,
      }),
    ).toThrow('bestQuality must be 0-100')
  })

  it('should reject localAvailable without local source', () => {
    const src = makeSource({ sourceType: 'jellyfin', sourceId: 'jf-1' })
    expect(() =>
      AvailabilityInfo.create({
        playable: true,
        preferredSource: src,
        availableSources: [src],
        bestQuality: 80,
        localAvailable: true,
      }),
    ).toThrow('localAvailable=true requires a local source')
  })

  it('should return preferredSourceType', () => {
    const src = makeSource()
    const info = AvailabilityInfo.create({
      playable: true,
      preferredSource: src,
      availableSources: [src],
      bestQuality: 80,
      localAvailable: true,
    })
    expect(info.preferredSourceType).toBe('local')
  })

  it('should return null preferredSourceType when unavailable', () => {
    expect(AvailabilityInfo.unavailable().preferredSourceType).toBeNull()
  })
})
