// local-media/scanner/FileClassifier.ts — CE5.3
// Classify media files: Movie, TV Series, Anime, Special, Unknown

import type { MediaFile, ClassifiedFile, MediaClassification } from '../contracts/local-media.types'
import { filenameParser } from '../../utils/FilenameParser'

export class FileClassifier {
  classify(file: MediaFile): ClassifiedFile {
    const parsed = filenameParser.parse(file.name, file.directory as 'Movies' | 'TV' | 'Anime')
    const classification = this._determineClassification(file, parsed)

    return {
      ...file,
      classification,
      parsed: parsed ? {
        title: parsed.title,
        year: parsed.year,
        season: parsed.season,
        episode: parsed.episode,
        resolution: parsed.resolution,
        source: parsed.source,
        isAnime: parsed.isAnime,
      } : undefined,
    }
  }

  classifyBatch(files: MediaFile[]): ClassifiedFile[] {
    return files.map(f => this.classify(f))
  }

  private _determineClassification(file: MediaFile, parsed: ReturnType<typeof filenameParser.parse>): MediaClassification {
    if (parsed) {
      if (parsed.isAnime) return 'anime'
      if (parsed.season !== undefined && parsed.episode !== undefined) return 'tv'
      if (parsed.year) return 'movie'
    }

    // Fallback: use directory name
    const dir = file.directory.toLowerCase()
    if (dir === 'anime') return 'anime'
    if (dir === 'tv' || dir === 'series') return 'tv'
    if (dir === 'movies') return 'movie'

    // Heuristic: filename contains SxxExx
    const name = file.name.toUpperCase()
    if (/S\d{1,2}E\d{1,3}/.test(name) || /\d{1,2}X\d{1,3}/.test(name)) return 'tv'
    if (/\[\s*.*\s*\]/.test(name)) return 'anime'

    return 'unknown'
  }

  getStats(files: ClassifiedFile[]): Record<MediaClassification, number> {
    const stats: Record<MediaClassification, number> = { movie: 0, tv: 0, anime: 0, special: 0, unknown: 0 }
    for (const f of files) stats[f.classification]++
    return stats
  }
}

export const fileClassifier = new FileClassifier()
