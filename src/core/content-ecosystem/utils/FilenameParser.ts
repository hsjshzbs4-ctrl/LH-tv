// core/content-ecosystem/utils/FilenameParser.ts — CE4
// Parse video filenames into structured data for metadata matching

import type { ParsedFilename } from '@provider-contracts'

// Common patterns: Show.S01E03.mkv, Movie.2022.1080p.mp4, [Group] Show - 03.mkv
const PATTERNS = {
  // Standard: Breaking.Bad.S01E03.1080p.mkv
  seasonEpisode: /^(.+?)[.\s]S(\d{1,2})E(\d{1,3})(?:[.\s]|$)/i,
  // Alt: Breaking.Bad.1x03.1080p.mkv
  altSeasonEpisode: /^(.+?)[.\s](\d{1,2})x(\d{1,3})(?:[.\s]|$)/i,
  // Movie with year: Interstellar.2014.2160p.mkv
  movieYear: /^(.+?)[.\s](\d{4})(?:[.\s]|$)/,
  // Anime bracket: [SubsPlease] Show Name - 03 [1080p].mkv
  animeBracket: /^\[(.+?)\]\s*(.+?)\s*-\s*(\d{1,3})(?:\s*\[|\s|$)/i,
  // Simple episode: Show.Name.E03.mkv
  simpleEpisode: /^(.+?)[.\s]E(\d{1,3})(?:[.\s]|$)/i,
}

const RESOLUTION_TAGS = ['2160p', '1080p', '720p', '480p', '4K', '2K', 'HD', 'SD']
const SOURCE_TAGS = ['WEB-DL', 'WEBRip', 'BRRip', 'BluRay', 'Blu-ray', 'HDRip', 'DVDRip', 'HDTV', 'AMZN', 'NF']
const ANIME_INDICATORS = [
  '[', ']', 'SubsPlease', 'HorribleSubs', 'Erai-raws', 'Judas',
  '1080p', '720p', 'HEVC', 'x264', 'x265', 'AAC', 'FLAC',
]

export class FilenameParser {
  parse(fileName: string, directory: 'Movies' | 'TV' | 'Anime'): ParsedFilename | null {
    // Remove extension
    const nameWithoutExt = fileName.replace(/\.(mkv|mp4|avi|mov|flv|webm)$/i, '')
    // Replace dots/underscores with spaces for pattern matching
    const normalized = nameWithoutExt

    let result: ParsedFilename | null = null

    // Try standard SxxExx
    let match = normalized.match(PATTERNS.seasonEpisode)
    if (match) {
      result = {
        title: this.cleanTitle(match[1] || ''),
        season: parseInt(match[2] || '0'),
        episode: parseInt(match[3] || '0'),
        isAnime: directory === 'Anime',
      }
    }

    // Try alt 1x03
    if (!result) {
      match = normalized.match(PATTERNS.altSeasonEpisode)
      if (match) {
        result = {
          title: this.cleanTitle(match[1] || ''),
          season: parseInt(match[2] || '0'),
          episode: parseInt(match[3] || '0'),
          isAnime: directory === 'Anime',
        }
      }
    }

    // Try movie year
    if (!result) {
      match = normalized.match(PATTERNS.movieYear)
      if (match) {
        result = {
          title: this.cleanTitle(match[1] || ''),
          year: parseInt(match[2] || '0'),
          isAnime: false,
        }
      }
    }

    // Try anime bracket
    if (!result || directory === 'Anime') {
      match = normalized.match(PATTERNS.animeBracket)
      if (match) {
        result = {
          title: this.cleanTitle(match[2] || ''),
          episode: parseInt(match[3] || '0'),
          isAnime: true,
        }
      }
    }

    // Try simple episode
    if (!result) {
      match = normalized.match(PATTERNS.simpleEpisode)
      if (match) {
        result = {
          title: this.cleanTitle(match[1] || ''),
          episode: parseInt(match[2] || '0'),
          isAnime: directory === 'Anime',
        }
      }
    }

    // Fallback: use whole name as title
    if (!result && directory === 'Movies') {
      result = {
        title: this.cleanTitle(nameWithoutExt),
        isAnime: false,
      }
    }

    if (!result) return null

    // Extract resolution and source tags
    const upper = normalized.toUpperCase()
    for (const tag of RESOLUTION_TAGS) {
      if (upper.includes(tag.toUpperCase())) { result.resolution = tag; break }
    }
    for (const tag of SOURCE_TAGS) {
      if (upper.includes(tag.toUpperCase())) { result.source = tag; break }
    }

    // Anime detection heuristics
    if (!result.isAnime) {
      const hasAnimeIndicator = ANIME_INDICATORS.some(tag => upper.includes(tag.toUpperCase()))
      if (hasAnimeIndicator) result.isAnime = true
    }

    return result
  }

  private cleanTitle(title: string): string {
    return title
      .replace(/[._]/g, ' ')     // dots/underscores → spaces
      .replace(/\s+/g, ' ')       // collapse whitespace
      .trim()
  }
}

export const filenameParser = new FilenameParser()
