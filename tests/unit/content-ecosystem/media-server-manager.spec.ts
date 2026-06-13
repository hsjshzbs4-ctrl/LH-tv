// tests/unit/content-ecosystem/media-server-manager.spec.ts — CE6.6
import { describe, it, expect } from 'vitest'
import { MediaServerManager } from '@/core/content-ecosystem/media-servers/manager/MediaServerManager'

describe('MediaServerManager', () => {
  it('creates Jellyfin server via factory', () => {
    const manager = new MediaServerManager()
    const server = manager.createServer('jellyfin', { id: 'jf-1', name: 'My Jellyfin', url: 'http://localhost:8096' })
    expect(server.id).toBe('jf-1')
    expect(server.serverType).toBe('jellyfin')
    expect(server.name).toBe('My Jellyfin')
  })

  it('creates Emby server via factory', () => {
    const manager = new MediaServerManager()
    const server = manager.createServer('emby', { id: 'emby-1', name: 'Emby', url: 'http://localhost:8096' })
    expect(server.serverType).toBe('emby')
  })

  it('creates Plex server via factory', () => {
    const manager = new MediaServerManager()
    const server = manager.createServer('plex', { id: 'plex-1', name: 'Plex', url: 'http://localhost:32400' })
    expect(server.serverType).toBe('plex')
  })

  it('registers and retrieves servers', () => {
    const manager = new MediaServerManager()
    const server = manager.createServer('jellyfin', { id: 'jf-1', name: 'J', url: 'http://localhost:8096' })
    manager.registerServer(server)
    expect(manager.getServers()).toHaveLength(1)
    expect(manager.getConnectedServers()).toHaveLength(0) // not connected
  })

  it('unregisters server', () => {
    const manager = new MediaServerManager()
    const server = manager.createServer('jellyfin', { id: 'jf-1', name: 'J', url: 'http://localhost:8096' })
    manager.registerServer(server)
    manager.unregisterServer('jf-1')
    expect(manager.getServers()).toHaveLength(0)
  })

  it('notifies subscribers on register', () => {
    const manager = new MediaServerManager()
    let called = 0
    manager.subscribe(() => called++)
    manager.registerServer(manager.createServer('jellyfin', { id: 'jf-1', name: 'J', url: 'http://localhost:8096' }))
    expect(called).toBe(1)
  })
})
