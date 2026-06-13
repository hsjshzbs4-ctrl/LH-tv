// src/provider-contracts/interfaces/IProvider.ts — Provider 标准接口
// P5.0: 全系统唯一 IProvider 定义，所有模块从此处导入

import type { MediaItem, MediaDetail } from '../types/media.types'

/** Provider 标准接口 */
export interface IProvider {
  id: string
  name: string
  enabled: boolean
  priority: number

  /** 搜索 */
  search(keyword: string): Promise<MediaItem[]>

  /** 获取详情 */
  detail(id: string): Promise<MediaDetail>

  /** 获取分类目录 */
  catalog?(type: string, sub: string): Promise<MediaItem[]>

  /** 健康检查 */
  healthCheck(): Promise<boolean>
}
