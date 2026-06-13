// src/shared/types/catalog.types.ts - 目录相关类型

import type { VideoType } from './video.types'

/** 目录项 */
export interface CatalogItem {
  name: string
  image?: string
  year?: number
  rating?: number
  genres?: string[]
  tags?: string[]
  type?: VideoType
  sub?: string
}

/** 目录子分类映射 */
export type CatalogMap = Record<VideoType, Record<string, CatalogItem[]>>

/** 年份范围 */
export interface YearRange {
  min: number
  max: number
}
