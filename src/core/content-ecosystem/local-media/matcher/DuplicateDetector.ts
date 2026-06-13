// local-media/matcher/DuplicateDetector.ts — CE5.6
// Detect duplicate media: same title, multiple resolutions, duplicate copies

import type { ClassifiedFile, MatchResult } from '../contracts/local-media.types'

export interface VersionGroup {
  title: string
  versions: VersionEntry[]
}

export interface VersionEntry {
  path: string
  resolution: string
  source: string
  size: number
}

export class DuplicateDetector {
  // Group files by matched metadata title
  groupByTitle(
    files: ClassifiedFile[],
    matches: Map<string, MatchResult>
  ): Map<string, ClassifiedFile[]> {
    const groups = new Map<string, ClassifiedFile[]>()

    for (const file of files) {
      const match = matches.get(file.path)
      const key = match?.metadata.title || file.parsed?.title || file.name
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(file)
    }

    return groups
  }

  // Build version groups for a set of files sharing the same title
  buildVersionGroups(files: ClassifiedFile[]): VersionGroup {
    const versions: VersionEntry[] = files.map(f => ({
      path: f.path,
      resolution: f.parsed?.resolution || 'Unknown',
      source: f.parsed?.source || 'Unknown',
      size: f.size,
    }))

    // Sort by quality: 4K > 2160p > 1080p > 720p > ...
    const qualityOrder = ['4K', '2160p', '1080p', '720p', '480p', 'Unknown']
    versions.sort((a, b) => {
      const ai = qualityOrder.indexOf(a.resolution)
      const bi = qualityOrder.indexOf(b.resolution)
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })

    return {
      title: files[0]?.parsed?.title || files[0]?.name || 'Unknown',
      versions,
    }
  }

  // Find exact duplicates (same fingerprint hash)
  findExactDuplicates(fingerprints: Map<string, string>): Map<string, string[]> {
    const byHash = new Map<string, string[]>()
    for (const [path, hash] of fingerprints) {
      if (!byHash.has(hash)) byHash.set(hash, [])
      byHash.get(hash)!.push(path)
    }

    const duplicates = new Map<string, string[]>()
    for (const [hash, paths] of byHash) {
      if (paths.length > 1) duplicates.set(hash, paths)
    }
    return duplicates
  }

  // Keep best version, mark others as duplicates
  selectBestVersion(group: VersionGroup): { keep: string; duplicates: string[] } {
    if (group.versions.length <= 1) {
      return { keep: group.versions[0]?.path || '', duplicates: [] }
    }

    const best = group.versions[0] // already sorted by quality
    const dups = group.versions.slice(1).map(v => v.path)
    return { keep: best.path, duplicates: dups }
  }
}
