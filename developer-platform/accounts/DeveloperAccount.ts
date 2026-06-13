// developer-platform/accounts/DeveloperAccount.ts
import type { DeveloperAccount as IDeveloperAccount, DeveloperProfile, DeveloperRole } from '../shared/types'

export class DeveloperAccountManager {
  private accounts = new Map<string, DeveloperProfile>()

  register(profile: DeveloperProfile): DeveloperProfile {
    this.accounts.set(profile.id, profile)
    return profile
  }

  get(id: string): DeveloperProfile | undefined { return this.accounts.get(id) }
  getAll(): DeveloperProfile[] { return Array.from(this.accounts.values()) }

  verify(id: string): void {
    const account = this.accounts.get(id)
    if (account) { account.verified = true; account.role = 'VERIFIED_DEVELOPER' }
  }

  updateRole(id: string, role: DeveloperRole): void {
    const account = this.accounts.get(id)
    if (account) account.role = role
  }

  getByRole(role: DeveloperRole): DeveloperProfile[] {
    return this.getAll().filter(a => a.role === role)
  }

  canPublish(id: string): boolean {
    const account = this.accounts.get(id)
    return account?.verified === true && account?.role === 'VERIFIED_DEVELOPER'
  }
}

export const developerAccountManager = new DeveloperAccountManager()
