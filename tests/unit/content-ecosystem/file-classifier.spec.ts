// tests/unit/content-ecosystem/file-classifier.spec.ts — CE5.3
import { describe, it, expect } from 'vitest'
import { FileClassifier } from '@/core/content-ecosystem/local-media/scanner/FileClassifier'
import type { MediaFile } from '@/core/content-ecosystem/local-media/contracts/local-media.types'

const classifier = new FileClassifier()

function makeFile(name: string, dir: string): MediaFile {
  return { path: `/media/${dir}/${name}`, name, extension: '.mkv', size: 1000, mtime: Date.now(), directory: dir, relativePath: name }
}

describe('FileClassifier', () => {
  it('classifies movie with year', () => {
    const result = classifier.classify(makeFile('Interstellar.2014.2160p.mkv', 'Movies'))
    expect(result.classification).toBe('movie')
    expect(result.parsed?.year).toBe(2014)
  })

  it('classifies TV with SxxExx', () => {
    const result = classifier.classify(makeFile('Breaking.Bad.S01E03.mkv', 'TV'))
    expect(result.classification).toBe('tv')
    expect(result.parsed?.season).toBe(1)
    expect(result.parsed?.episode).toBe(3)
  })

  it('classifies anime from directory', () => {
    const result = classifier.classify(makeFile('Naruto.S01E01.mkv', 'Anime'))
    expect(result.classification).toBe('anime')
  })

  it('classifies anime bracket format', () => {
    const result = classifier.classify(makeFile('[SubsPlease] Demon Slayer - 03 [1080p].mkv', 'Anime'))
    expect(result.classification).toBe('anime')
  })

  it('batch classify returns stats', () => {
    const files = [
      makeFile('Movie.2022.mkv', 'Movies'),
      makeFile('Show.S01E01.mkv', 'TV'),
      makeFile('Anime.S01E01.mkv', 'Anime'),
    ]
    const classified = classifier.classifyBatch(files)
    const stats = classifier.getStats(classified)
    expect(stats.movie).toBeGreaterThanOrEqual(1)
    expect(stats.tv).toBeGreaterThanOrEqual(1)
    expect(stats.anime).toBeGreaterThanOrEqual(1)
  })
})
