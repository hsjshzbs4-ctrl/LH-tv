// src/core/download/index.ts - 下载模块统一导出

export { DownloadQueue } from './queue/DownloadQueue'
export { TaskScheduler } from './queue/TaskScheduler'
export type { StartTaskFn } from './queue/TaskScheduler'

export { DownloadManager } from './manager/DownloadManager'
export { DownloadFacade, downloadFacade } from './facade/DownloadFacade'
export { DownloadPersistenceManager } from './persistence/DownloadPersistenceManager'
export { RecoveryManager } from './recovery/RecoveryManager'

export type {
  DownloadStatus,
  DownloadTask,
  DownloadProgress,
  CreateDownloadTaskParams,
  LegacyDownloadResult,
  LegacyProgressData,
  LegacyCompleteData,
  LegacyErrorData,
} from './types/download.types'
