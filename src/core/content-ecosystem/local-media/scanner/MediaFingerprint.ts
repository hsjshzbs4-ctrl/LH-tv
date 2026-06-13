// local-media/scanner/MediaFingerprint.ts — CE5.4
// Generate fingerprint for duplicate detection: SHA1(filename + size)

import type { MediaFingerprint as MediaFingerprintType, MediaFile } from '../contracts/local-media.types'

export class MediaFingerprint {
  async generate(file: MediaFile): Promise<MediaFingerprintType> {
    const input = `${file.path}:${file.size}`
    const hash = await this._sha1(input)
    return {
      hash,
      path: file.path,
      size: file.size,
      createdAt: Date.now(),
    }
  }

  async generateBatch(files: MediaFile[]): Promise<Map<string, MediaFingerprintType>> {
    const map = new Map<string, MediaFingerprintType>()
    for (const file of files) {
      const fp = await this.generate(file)
      map.set(fp.hash, fp)
    }
    return map
  }

  // Detect duplicates: same hash → same file
  findDuplicatesByHash(fingerprints: Map<string, MediaFingerprintType>): Map<string, MediaFingerprintType[]> {
    const byHash = new Map<string, MediaFingerprintType[]>()
    for (const [hash, fp] of fingerprints) {
      if (!byHash.has(hash)) byHash.set(hash, [])
      byHash.get(hash)!.push(fp)
    }
    // Keep only groups with >1 entry
    const duplicates = new Map<string, MediaFingerprintType[]>()
    for (const [hash, group] of byHash) {
      if (group.length > 1) duplicates.set(hash, group)
    }
    return duplicates
  }

  // SHA1 implementation (browser-compatible)
  private async _sha1(input: string): Promise<string> {
    try {
      // Node.js crypto
      const crypto = await import('crypto')
      return crypto.createHash('sha1').update(input).digest('hex')
    } catch {
      // Browser fallback: simple hash
      let hash = 0
      for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash |= 0
      }
      return Math.abs(hash).toString(16)
    }
  }
}
