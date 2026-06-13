// local-media/LocalMediaFacade.ts — CE5 Facade (View-layer singleton)
import { LibraryManager } from './library/LibraryManager'
import { ScanService } from './services/ScanService'
import type { ScanResult, ScanJob } from './contracts/local-media.types'
import type { LibraryQuery, LibraryStats, LibraryConfig, LibraryDirectory } from './contracts/library.types'
import type { SearchIndexEntry } from './library/LibraryIndexer'

export class LocalMediaFacade {
  private manager = new LibraryManager()
  private scanService = new ScanService(this.manager)

  async initialize(): Promise<void> {
    await this.manager.initialize()
  }

  // ─── Scan ───
  async scan(directories: string[], options?: { signal?: AbortSignal; onProgress?: (job: ScanJob) => void }): Promise<ScanResult> {
    return this.scanService.startScan(directories, {
      incremental: false,
      signal: options?.signal,
      onProgress: options?.onProgress,
    })
  }

  getCurrentScanJob(): ScanJob | null { return this.scanService.getCurrentJob() }
  cancelScan(): void { this.scanService.cancelScan() }

  // ─── Library ───
  getMovies() { return this.manager.getMovies() }
  getSeries() { return this.manager.getSeries() }
  search(query: LibraryQuery): SearchIndexEntry[] { return this.manager.search(query) }
  remove(id: string): void { this.manager.remove(id) }

  // ─── Config ───
  getConfig(): LibraryConfig { return this.manager.getConfig() }
  addDirectory(dir: LibraryDirectory): void { this.manager.addDirectory(dir) }

  // ─── Watch ───
  get watchState() { return this.manager.watchState }
  getContinueWatching() { return this.manager.watchState.getContinueWatching() }

  // ─── Stats ───
  getStats(): LibraryStats { return this.manager.getStats() }

  // ─── Subscribe ───
  subscribe(cb: () => void): () => void { return this.manager.subscribe(cb) }
}

export const localMediaFacade = new LocalMediaFacade()
