// tests/unit/content-ecosystem/filename-parser.spec.ts — CE4
import { describe, it, expect } from 'vitest'
import { FilenameParser } from '@/core/content-ecosystem/utils/FilenameParser'

const parser = new FilenameParser()

describe('FilenameParser', () => {
  it('parses standard SxxExx format', () => {
    const result = parser.parse('Breaking.Bad.S01E03.1080p.mkv', 'TV')
    expect(result).not.toBeNull()
    expect(result!.title).toContain('Breaking Bad')
    expect(result!.season).toBe(1)
    expect(result!.episode).toBe(3)
    expect(result!.resolution).toBe('1080p')
  })

  it('parses alt 1x03 format', () => {
    const result = parser.parse('Attack.on.Titan.4x10.1080p.mkv', 'Anime')
    expect(result).not.toBeNull()
    expect(result!.title).toContain('Attack on Titan')
    expect(result!.season).toBe(4)
    expect(result!.episode).toBe(10)
  })

  it('parses movie with year', () => {
    const result = parser.parse('Interstellar.2014.2160p.mkv', 'Movies')
    expect(result).not.toBeNull()
    expect(result!.title).toContain('Interstellar')
    expect(result!.year).toBe(2014)
  })

  it('parses anime bracket format', () => {
    const result = parser.parse('[SubsPlease] Demon Slayer - 03 [1080p].mkv', 'Anime')
    expect(result).not.toBeNull()
    expect(result!.isAnime).toBe(true)
    expect(result!.episode).toBe(3)
  })

  it('detects anime from directory', () => {
    const result = parser.parse('Naruto.S01E01.mkv', 'Anime')
    expect(result).not.toBeNull()
    expect(result!.isAnime).toBe(true)
  })

  it('handles mp4 files', () => {
    const result = parser.parse('Movie.2023.1080p.mp4', 'Movies')
    expect(result).not.toBeNull()
    expect(result!.year).toBe(2023)
  })
})
