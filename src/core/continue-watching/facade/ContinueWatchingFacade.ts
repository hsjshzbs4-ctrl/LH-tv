// src/core/continue-watching/facade/ContinueWatchingFacade.ts

import { ContinueWatchingManager } from '../manager/ContinueWatchingManager'
import type { ContinueWatchingItem } from '../types/continue.types'

export class ContinueWatchingFacade {
  private manager = new ContinueWatchingManager()

  async initialize(): Promise<void> { return this.manager.initialize() }
  refresh(): void { this.manager.refresh() }
  getContinueWatching(): ContinueWatchingItem[] { return this.manager.getContinueWatching() }
  getByMedia(mediaId: string): ContinueWatchingItem | null { return this.manager.getByMedia(mediaId) }
  subscribe(callback: () => void): () => void { return this.manager.subscribe(callback) }
}

export const continueWatchingFacade = new ContinueWatchingFacade()
