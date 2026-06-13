// local-media/library/LibraryManager.ts — CE5.7/5.8
// Central coordinator: builds library from scan results, manages CRUD, indexing

import type {
  ClassifiedFile, MatchResult, LibraryMovie, LibrarySeries,
  LibrarySeason, LibraryEpisode, MediaVersion,
} from '../contracts/local-media.types'
import type { LibraryQuery, LibraryStats, LibraryConfig, LibraryDirectory } from '../contracts/library.types'
import { LibraryRepository } from './LibraryRepository'
import { LibraryIndexer, type SearchIndexEntry } from './LibraryIndexer'
import { WatchStateManager } from '../watch/WatchStateManager'

export class LibraryManager {
  private repo = new LibraryRepository()
  private indexer = new LibraryIndexer()
  watchState: WatchStateManager
  private subscribers = new Set<() => void>()

  constructor() {
    this.watchState = new WatchStateManager(this.repo)
  }

  async initialize(): Promise<void> {
    await this.repo.load()
    this.indexer.build(this.repo.getMovies(), this.repo.getSeries())
  }

  // ─── Build from Scan ───
  async buildFromScan(
    files: ClassifiedFile[],
    matches: Map<string, MatchResult>,
    _duplicates: Map<string, any>,
  ): Promise<void> {
    for (const file of files) {
      const match = matches.get(file.path)
      if (!match) continue

      if (file.classification === 'movie') {
        const movie = this._buildMovie(file, match)
        this.repo.addMovie(movie)
      } else if (file.classification === 'tv' || file.classification === 'anime') {
        const series = this._buildSeries(file, match)
        this.repo.addSeries(series)
      }
    }

    this.indexer.build(this.repo.getMovies(), this.repo.getSeries())
    await this.repo.save()
    this._notify()
  }

  // ─── CRUD ───
  getMovies(): LibraryMovie[] { return this.repo.getMovies() }
  getMovie(id: string): LibraryMovie | undefined { return this.repo.getMovie(id) }
  getSeries(): LibrarySeries[] { return this.repo.getSeries() }
  getSeriesById(id: string): LibrarySeries | undefined { return this.repo.getSeriesById(id) }

  remove(id: string): void {
    this.repo.removeMovie(id)
    this.repo.removeSeries(id)
    this._notify()
  }

  // ─── Search ───
  search(query: LibraryQuery): SearchIndexEntry[] {
    if (!this.indexer.isBuilt()) this.indexer.build(this.repo.getMovies(), this.repo.getSeries())
    return this.indexer.search(query)
  }

  // ─── Config ───
  getConfig(): LibraryConfig { return this.repo.getConfig() }
  updateConfig(updates: Partial<LibraryConfig>): void { this.repo.updateConfig(updates) }
  addDirectory(dir: LibraryDirectory): void {
    const config = this.repo.getConfig()
    config.directories.push(dir)
    this.repo.updateConfig(config)
  }

  // ─── Stats ───
  getStats(): LibraryStats { return this.repo.getStats() }

  // ─── Subscribers ───
  subscribe(cb: () => void): () => void { this.subscribers.add(cb); return () => this.subscribers.delete(cb) }
  private _notify(): void { for (const cb of this.subscribers) cb() }

  // ─── Internal Builders ───
  private _buildMovie(file: ClassifiedFile, match: MatchResult): LibraryMovie {
    const version: MediaVersion = {
      path: file.path, resolution: file.parsed?.resolution || 'Unknown',
      source: file.parsed?.source || 'Unknown', size: file.size, fingerprint: '',
    }
    return {
      id: `movie-${match.metadata.externalIds.tmdb || file.name}`,
      metadataId: match.metadata.externalIds.tmdb as string,
      title: match.metadata.title, originalTitle: match.metadata.originalTitle,
      year: match.metadata.year, poster: match.metadata.poster,
      backdrop: match.metadata.backdrop, overview: match.metadata.overview,
      genres: match.metadata.genres, rating: match.metadata.rating,
      runtime: match.metadata.runtime, paths: [file.path], versions: [version],
      watched: false, addedAt: Date.now(), updatedAt: Date.now(),
    }
  }

  private _buildSeries(file: ClassifiedFile, match: MatchResult): LibrarySeries {
    const ep: LibraryEpisode = {
      id: `ep-${file.name}`, episodeNumber: file.parsed?.episode || 1,
      title: file.parsed?.title || file.name, path: file.path,
      size: file.size, fingerprint: '',
      watched: false, resumePosition: 0, duration: 0, completed: false,
    }
    const season: LibrarySeason = {
      id: `s-${file.parsed?.season || 1}`, seasonNumber: file.parsed?.season || 1,
      title: `Season ${file.parsed?.season || 1}`, episodeCount: 1, episodes: [ep],
    }
    return {
      id: `series-${match.metadata.externalIds.tmdb || file.parsed?.title || file.name}`,
      metadataId: match.metadata.externalIds.tmdb as string,
      title: match.metadata.title, originalTitle: match.metadata.originalTitle,
      year: match.metadata.year, poster: match.metadata.poster,
      backdrop: match.metadata.backdrop, overview: match.metadata.overview,
      genres: match.metadata.genres, rating: match.metadata.rating,
      status: 'Continuing', seasons: [season],
      addedAt: Date.now(), updatedAt: Date.now(),
    }
  }
}
