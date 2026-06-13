// local-media/contracts/scan.types.ts — CE5.1 Scan configuration types

export interface WalkOptions {
  recursive: boolean
  followSymlinks: boolean
  ignoreHidden: boolean
  extensions: readonly string[]
  maxDepth?: number
  onProgress?: (progress: WalkProgress) => void
  signal?: AbortSignal
}

export interface WalkProgress {
  directoriesScanned: number
  filesFound: number
  currentDirectory: string
}

export interface ScanOptions {
  directories: string[]      // root paths to scan
  incremental: boolean       // true = only scan modified files
  forceFullScan: boolean     // true = ignore incremental cache
}

export interface RefreshOptions {
  fullScan: boolean
  directories?: string[]
}
