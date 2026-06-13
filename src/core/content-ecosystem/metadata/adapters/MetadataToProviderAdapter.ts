// core/content-ecosystem/metadata/adapters/MetadataToProviderAdapter.ts — CE4
// Wraps IMetadataProvider as IProvider for AggregationEngine compatibility

import type { IProvider, IMetadataProvider, MediaItem, MediaDetail } from '@provider-contracts'

export class MetadataToProviderAdapter implements IProvider {
  id: string
  name: string
  enabled: boolean
  priority: number

  constructor(private metadata: IMetadataProvider) {
    this.id = metadata.id
    this.name = metadata.name
    this.enabled = metadata.enabled
    this.priority = metadata.priority
  }

  async search(keyword: string): Promise<MediaItem[]> {
    return this.metadata.search(keyword)
  }

  async detail(id: string): Promise<MediaDetail> {
    try {
      return await this.metadata.getMovie(id) as MediaDetail
    } catch {
      return await this.metadata.getSeries(id) as MediaDetail
    }
  }

  async catalog?(type: string, sub?: string): Promise<MediaItem[]> {
    if (type === 'trending') return this.metadata.getTrending(sub as 'movie' | 'tv')
    if (type === 'popular') return this.metadata.getPopular(sub as 'movie' | 'tv')
    return []
  }

  async healthCheck(): Promise<boolean> {
    return this.metadata.healthCheck()
  }
}
