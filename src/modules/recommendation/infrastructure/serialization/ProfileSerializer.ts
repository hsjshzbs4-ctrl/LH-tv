// modules/recommendation/infrastructure/serialization/ProfileSerializer.ts — CE9-D

import type { ProfileDto } from '../../application/mappers/ProfileMapper'

export class ProfileSerializer {
  serialize(profile: ProfileDto): string {
    return JSON.stringify({ v: 1, ...profile })
  }

  deserialize(json: string): ProfileDto | null {
    try { return JSON.parse(json) as ProfileDto }
    catch { return null }
  }
}
