// local-media/scanner/DirectoryWalker.ts — CE5.2
// Recursive directory traversal with symlink support, cancellation, progress

import type { MediaFile } from '../contracts/local-media.types'
import type { WalkOptions, WalkProgress } from '../contracts/scan.types'
import { VIDEO_EXTENSIONS, IGNORE_EXTENSIONS } from '../contracts/local-media.types'

export class DirectoryWalker {
  private aborted = false
  private progress: WalkProgress = { directoriesScanned: 0, filesFound: 0, currentDirectory: '' }

  async walk(root: string, options: WalkOptions): Promise<MediaFile[]> {
    this.aborted = false
    this.progress = { directoriesScanned: 0, filesFound: 0, currentDirectory: root }

    const files: MediaFile[] = []
    const extSet = new Set(options.extensions.map(e => e.toLowerCase()))

    await this._walk(root, root, extSet, options, files, 0)
    return files
  }

  private async _walk(
    root: string,
    currentDir: string,
    extSet: Set<string>,
    options: WalkOptions,
    files: MediaFile[],
    depth: number,
  ): Promise<void> {
    if (this.aborted) return
    if (options.signal?.aborted) { this.aborted = true; return }
    if (options.maxDepth !== undefined && depth > options.maxDepth) return

    this.progress.currentDirectory = currentDir
    this.progress.directoriesScanned++

    let entries: string[] = []
    try {
      // Use a dependency-injectable readdir function
      entries = await this._readdir(currentDir)
    } catch {
      return // permission denied, skip
    }

    for (const entry of entries) {
      if (this.aborted || options.signal?.aborted) break

      // Skip hidden files/folders
      if (options.ignoreHidden && entry.startsWith('.')) continue

      const fullPath = `${currentDir}/${entry}`
      let stats
      try {
        stats = await this._stat(fullPath)
      } catch { continue }

      if (stats.isDirectory()) {
        if (options.recursive) {
          await this._walk(root, fullPath, extSet, options, files, depth + 1)
        }
      } else if (stats.isFile()) {
        const ext = entry.substring(entry.lastIndexOf('.')).toLowerCase()
        // Skip non-media files
        if (IGNORE_EXTENSIONS.includes(ext as any)) continue
        if (extSet.size > 0 && !extSet.has(ext)) continue

        const directory = this._classifyDirectory(fullPath, root)
        files.push({
          path: fullPath,
          name: entry,
          extension: ext,
          size: stats.size,
          mtime: stats.mtime,
          directory,
          relativePath: fullPath.replace(root, '').replace(/^\//, ''),
        })
        this.progress.filesFound++

        if (options.onProgress && files.length % 100 === 0) {
          options.onProgress({ ...this.progress })
        }
      }
    }
  }

  private _classifyDirectory(filePath: string, root: string): string {
    const rel = filePath.replace(root, '').toLowerCase()
    if (rel.includes('/anime') || rel.includes('\\anime')) return 'Anime'
    if (rel.includes('/tv') || rel.includes('\\tv') || rel.includes('/series')) return 'TV'
    return 'Movies'
  }

  // ─── Injectable FS operations (for test mocking) ───
  private async _readdir(dir: string): Promise<string[]> {
    if (typeof window !== 'undefined' && (window as any).app?.readDirectory) {
      return (window as any).app.readDirectory(dir)
    }
    // Node.js environment (tests)
    const fs = await import('fs/promises')
    return fs.readdir(dir)
  }

  private async _stat(path: string): Promise<{ isDirectory: () => boolean; isFile: () => boolean; size: number; mtime: number }> {
    if (typeof window !== 'undefined' && (window as any).app?.statFile) {
      return (window as any).app.statFile(path)
    }
    const fs = await import('fs/promises')
    const s = await fs.stat(path)
    return { isDirectory: () => s.isDirectory(), isFile: () => s.isFile(), size: s.size, mtime: s.mtimeMs }
  }
}
