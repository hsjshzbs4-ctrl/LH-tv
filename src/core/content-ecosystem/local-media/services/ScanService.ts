// local-media/services/ScanService.ts — CE5.9
// Orchestrates scan: Walk → Classify → Fingerprint → Match → Build Library

import type { MediaFile, ClassifiedFile, ScanJob, ScanResult, MatchResult } from '../contracts/local-media.types'
import type { WalkOptions } from '../contracts/scan.types'
import { DirectoryWalker } from '../scanner/DirectoryWalker'
import { FileClassifier } from '../scanner/FileClassifier'
import { MediaFingerprint } from '../scanner/MediaFingerprint'
import { MetadataMatcher } from '../matcher/MetadataMatcher'
import { DuplicateDetector } from '../matcher/DuplicateDetector'
import { LibraryManager } from '../library/LibraryManager'

export class ScanService {
  private walker = new DirectoryWalker()
  private classifier = new FileClassifier()
  private fingerprinter = new MediaFingerprint()
  private matcher = new MetadataMatcher()
  private deduper = new DuplicateDetector()
  private currentJob: ScanJob | null = null

  constructor(private libraryManager: LibraryManager) {}

  async startScan(
    directories: string[],
    options: { incremental?: boolean; signal?: AbortSignal; onProgress?: (job: ScanJob) => void }
  ): Promise<ScanResult> {
    const jobId = `scan-${Date.now()}`
    this.currentJob = {
      id: jobId,
      state: 'running',
      directory: directories.join(', '),
      startedAt: Date.now(),
      progress: { total: 0, scanned: 0, matched: 0, currentDirectory: '' },
    }

    const startedAt = Date.now()
    let allFiles: MediaFile[] = []

    // 1. Walk directories
    for (const dir of directories) {
      this.currentJob.progress.currentDirectory = dir
      const walkOpts: WalkOptions = {
        recursive: true,
        followSymlinks: true,
        ignoreHidden: true,
        extensions: ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.m4v', '.ts', '.webm'],
        signal: options.signal,
        onProgress: wp => {
          this.currentJob!.progress.total = wp.filesFound
          options.onProgress?.(this.currentJob!)
        },
      }
      const files = await this.walker.walk(dir, walkOpts)
      allFiles.push(...files)
    }

    this.currentJob.progress.total = allFiles.length
    this.currentJob.progress.scanned = allFiles.length
    options.onProgress?.(this.currentJob)

    // 2. Classify
    const classified = this.classifier.classifyBatch(allFiles)
    const stats = this.classifier.getStats(classified)

    // 3. Fingerprint
    const fingerprints = await this.fingerprinter.generateBatch(classified)
    const dups = this.fingerprinter.findDuplicatesByHash(fingerprints as any)

    // 4. Match with metadata
    let matched = 0
    const matches = new Map<string, MatchResult>()
    const unmatched = classified.filter(f => !f.parsed)

    for (const file of classified.filter(f => f.parsed)) {
      const match = await this.matcher.match(file)
      if (match) {
        matches.set(file.path, match)
        matched++
      }
    }

    this.currentJob.progress.matched = matched
    options.onProgress?.(this.currentJob)

    // 5. Build library
    await this.libraryManager.buildFromScan(classified, matches, dups as any)

    const elapsed = Date.now() - startedAt
    this.currentJob = { ...this.currentJob, state: 'completed', completedAt: Date.now() }

    const result: ScanResult = {
      directory: directories.join(', '),
      totalFiles: allFiles.length,
      newFiles: classified.length,
      removedFiles: 0,
      matchedFiles: matched,
      unmatchedFiles: classified.length - matched + unmatched.length,
      elapsedMs: elapsed,
    }

    this.currentJob.result = result
    return result
  }

  getCurrentJob(): ScanJob | null { return this.currentJob }
  cancelScan(): void { if (this.currentJob) this.currentJob.state = 'cancelled' }
}
