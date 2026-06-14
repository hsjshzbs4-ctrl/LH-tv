// modules/search-unified/ipc/registration/SearchIPCRegistration.ts — CE8-D
// Central registration point. No scattered ipcMain.handle calls.

import { SEARCH_IPC_CHANNELS } from '../channels/SearchIPCChannels'
import type { SearchIPCController } from '../controller/SearchIPCController'

export interface IPCRegistry {
  handle(channel: string, handler: (...args: any[]) => unknown): void
  removeHandler(channel: string): void
}

export class SearchIPCRegistration {
  private registered = false

  constructor(
    private registry: IPCRegistry,
    private controller: SearchIPCController,
  ) {}

  /** Register all search IPC handlers. Idempotent. */
  register(): void {
    if (this.registered) return

    this.registry.handle(SEARCH_IPC_CHANNELS.SEARCH_EXECUTE, (_, req) => this.controller.search(req))
    this.registry.handle(SEARCH_IPC_CHANNELS.SEARCH_SUGGEST, (_, req) => this.controller.suggest(req))
    this.registry.handle(SEARCH_IPC_CHANNELS.SEARCH_CLICK, (_, req) => this.controller.recordClick(req))
    this.registry.handle(SEARCH_IPC_CHANNELS.SEARCH_PLAY, (_, req) => this.controller.recordPlay(req))
    this.registry.handle(SEARCH_IPC_CHANNELS.SEARCH_HISTORY, (_, req) => this.controller.getHistory(req))
    this.registry.handle(SEARCH_IPC_CHANNELS.SEARCH_TRENDING, (_, req) => this.controller.getTrending(req))
    this.registry.handle(SEARCH_IPC_CHANNELS.SEARCH_PROFILE, (_, req) => this.controller.getProfile(req))
    this.registry.handle(SEARCH_IPC_CHANNELS.SEARCH_HEALTH, () => this.controller.getHealth())
    this.registry.handle(SEARCH_IPC_CHANNELS.SEARCH_DIAGNOSTICS, () => this.controller.getHealth())

    this.registered = true
  }

  /** Unregister all search IPC handlers. */
  unregister(): void {
    for (const channel of Object.values(SEARCH_IPC_CHANNELS)) {
      this.registry.removeHandler(channel)
    }
    this.registered = false
  }

  get isRegistered(): boolean { return this.registered }
}
