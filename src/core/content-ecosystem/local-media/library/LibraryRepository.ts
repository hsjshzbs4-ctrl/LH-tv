// local-media/library/LibraryRepository.ts — CE5.8
// Persistence layer for library data (uses storageService, consistent with project architecture)
// Tables represented as typed collections within UserData schema

import type {
  LibraryMovie, LibrarySeries, LibraryEpisode,
  WatchState, ScanJob,
} from '../contracts/local-media.types'
import type { LibraryStats, LibraryConfig } from '../contracts/library.types'

export interface LibraryData {
  movies: LibraryMovie[]
  series: LibrarySeries[]
  watchStates: WatchState[]
  scanJobs: ScanJob[]
  config: LibraryConfig
  lastUpdated: number
}

export class LibraryRepository {
  private data: LibraryData = {
    movies: [],
    series: [],
    watchStates: [],
    scanJobs: [],
    config: { directories: [], autoScan: false, autoScanInterval: 3600000, watchStates: true },
    lastUpdated: 0,
  }
  private loaded = false

  async load(): Promise<void> {
    // Load from storageService (IPC to main process)
    if (typeof window !== 'undefined' && (window as any).app?.storageLoad) {
      try {
        const raw = await (window as any).app.storageLoad()
        if (raw?.library) {
          this.data = { ...this.data, ...raw.library }
        }
      } catch { /* first load, use defaults */ }
    }
    this.loaded = true
  }

  async save(): Promise<void> {
    this.data.lastUpdated = Date.now()
    if (typeof window !== 'undefined' && (window as any).app?.storageSave) {
      await (window as any).app.storageSave({ library: this.data })
    }
    // In test mode, data is in-memory only
  }

  // ─── Movies ───
  getMovies(): LibraryMovie[] { return this.data.movies }
  getMovie(id: string): LibraryMovie | undefined { return this.data.movies.find(m => m.id === id) }
  addMovie(movie: LibraryMovie): void {
    const idx = this.data.movies.findIndex(m => m.id === movie.id)
    if (idx >= 0) this.data.movies[idx] = movie
    else this.data.movies.push(movie)
  }
  removeMovie(id: string): void { this.data.movies = this.data.movies.filter(m => m.id !== id) }

  // ─── Series ───
  getSeries(): LibrarySeries[] { return this.data.series }
  getSeriesById(id: string): LibrarySeries | undefined { return this.data.series.find(s => s.id === id) }
  addSeries(series: LibrarySeries): void {
    const idx = this.data.series.findIndex(s => s.id === series.id)
    if (idx >= 0) this.data.series[idx] = series
    else this.data.series.push(series)
  }
  removeSeries(id: string): void { this.data.series = this.data.series.filter(s => s.id !== id) }

  // ─── Watch States ───
  getWatchStates(): WatchState[] { return this.data.watchStates }
  getWatchState(mediaId: string): WatchState | undefined { return this.data.watchStates.find(w => w.mediaId === mediaId) }
  setWatchState(state: WatchState): void {
    const idx = this.data.watchStates.findIndex(w => w.mediaId === state.mediaId)
    if (idx >= 0) this.data.watchStates[idx] = state
    else this.data.watchStates.push(state)
  }

  // ─── Scan Jobs ───
  getScanJobs(): ScanJob[] { return this.data.scanJobs }
  addScanJob(job: ScanJob): void { this.data.scanJobs.push(job) }
  updateScanJob(id: string, updates: Partial<ScanJob>): void {
    const idx = this.data.scanJobs.findIndex(j => j.id === id)
    if (idx >= 0) this.data.scanJobs[idx] = { ...this.data.scanJobs[idx], ...updates }
  }

  // ─── Config ───
  getConfig(): LibraryConfig { return this.data.config }
  updateConfig(updates: Partial<LibraryConfig>): void {
    this.data.config = { ...this.data.config, ...updates }
  }

  // ─── Stats ───
  getStats(): LibraryStats {
    let totalEpisodes = 0
    let totalSize = 0
    for (const s of this.data.series) {
      for (const season of s.seasons) {
        totalEpisodes += season.episodes.length
        for (const ep of season.episodes) totalSize += ep.size
      }
    }
    for (const m of this.data.movies) {
      for (const v of m.versions) totalSize += v.size
    }
    return {
      totalMovies: this.data.movies.length,
      totalSeries: this.data.series.length,
      totalEpisodes,
      totalSize,
      unmatchedFiles: 0,
    }
  }
}
