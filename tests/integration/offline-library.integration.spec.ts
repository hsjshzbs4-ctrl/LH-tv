// tests/integration/offline-library.integration.spec.ts — 下载完成 → OfflineLibrary 集成
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OfflineLibraryManager } from '@/core/offline/manager/OfflineLibraryManager'
import { storageService } from '@/shared/storage/storage.service'
import type { OfflineMedia } from '@/core/offline/types/offline.types'
import type { DownloadTask } from '@/core/download/types/download.types'

function off(id: string, title: string): OfflineMedia {
  return { id, mediaId: `m-${id}`, providerId: 'p1', title, cover: '',
    episodeId: `ep-${id}`, episodeLabel: '第01集', episodeNum: 1,
    localFilePath: `C:\\media\\${id}.mp4`, fileSize: 100*1024*1024,
    downloadedAt: Date.now(), exists: false }
}

describe('Offline Library Integration Flow', () => {
  let persistedOffline: OfflineMedia[] = []
  let persistedDownloads: DownloadTask[] = []

  beforeEach(() => {
    persistedOffline = []
    persistedDownloads = []
    vi.spyOn(storageService, 'getOfflineLibrary').mockImplementation(async () => [...persistedOffline])
    vi.spyOn(storageService, 'setOfflineLibrary').mockImplementation(async (items: OfflineMedia[]) => {
      persistedOffline = [...items]
    })
    vi.spyOn(storageService, 'getDownloadHistory').mockImplementation(async () => [...persistedDownloads])

    const app = (window as Record<string, unknown>).app as Record<string, Record<string, unknown>>
    const getLocalLibrary = app.getLocalLibrary as ReturnType<typeof vi.fn>
    getLocalLibrary.mockResolvedValue([])
    const delEp = app.deleteLocalEpisode as ReturnType<typeof vi.fn>
    delEp.mockResolvedValue(true)
  })

  afterEach(() => { vi.restoreAllMocks() })

  // Case 01: 下载完成 → Library 更新
  it('Case 01: should add to offline library after download completes', async () => {
    const mgr = new OfflineLibraryManager()
    await mgr.addMedia(off('1', 'Naruto Ep1'))
    await mgr.addMedia(off('2', 'One Piece Ep1'))

    expect(mgr.getAllMedia()).toHaveLength(2)

    // 模拟: 重建后验证持久化
    const restored = new OfflineLibraryManager()
    await restored.load()
    expect(restored.getAllMedia()).toHaveLength(2)
  })

  // Case 02: 删除文件 → 索引同步删除
  it('Case 02: should sync deletion to index', async () => {
    const mgr = new OfflineLibraryManager()
    await mgr.addMedia(off('1', 'Show A'))
    await mgr.addMedia(off('2', 'Show B'))

    await mgr.removeMedia('1')
    expect(mgr.getMedia('1')).toBeUndefined()
    expect(mgr.getAllMedia()).toHaveLength(1)

    // 持久化同步
    expect(persistedOffline).toHaveLength(1)
    expect(persistedOffline[0].id).toBe('2')
  })

  // Case 03: 搜索功能
  it('Case 03: should search across offline library', async () => {
    const mgr = new OfflineLibraryManager()
    await mgr.addMedia(off('1', 'Naruto'))
    await mgr.addMedia(off('2', 'Bleach'))
    await mgr.addMedia(off('3', 'One Piece'))

    const results = mgr.search('nar')
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Naruto')
  })

  // Case 04: Subscription notification
  it('Case 04: should notify subscribers on mutation', async () => {
    const mgr = new OfflineLibraryManager()
    let count = 0
    const unsub = mgr.subscribe(() => { count++ })

    await mgr.addMedia(off('1', 'Test'))
    expect(count).toBe(1)

    await mgr.removeMedia('1')
    expect(count).toBe(2)

    unsub()
    await mgr.addMedia(off('2', 'Silent'))
    expect(count).toBe(2) // no longer notified
  })
})
