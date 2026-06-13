// developer-platform/publishing/PluginSubmissionService.ts
import { developerAccountManager } from '../accounts/DeveloperAccount'
import type { PluginSubmission, ReviewState } from '../shared/types'

export class PluginSubmissionService {
  private submissions = new Map<string, PluginSubmission>()

  submit(developerId: string, manifest: Record<string, unknown>): { success: boolean; submissionId?: string; error?: string } {
    if (!developerAccountManager.canPublish(developerId)) {
      return { success: false, error: 'Developer not verified for publishing' }
    }
    const id = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const submission: PluginSubmission = {
      id, developerId, manifest, state: 'SUBMITTED', submittedAt: Date.now(),
    }
    this.submissions.set(id, submission)
    return { success: true, submissionId: id }
  }

  getSubmission(id: string): PluginSubmission | undefined { return this.submissions.get(id) }
  getByDeveloper(developerId: string): PluginSubmission[] {
    return Array.from(this.submissions.values()).filter(s => s.developerId === developerId)
  }

  transition(id: string, to: ReviewState, notes?: string): void {
    const sub = this.submissions.get(id)
    if (!sub) return
    sub.state = to
    if (notes) sub.reviewerNotes = notes
    if (to === 'APPROVED' || to === 'REJECTED') sub.reviewedAt = Date.now()
  }

  getAll(): PluginSubmission[] { return Array.from(this.submissions.values()) }

  validateManifest(manifest: Record<string, unknown>): string[] {
    const errors: string[] = []
    if (!manifest.id) errors.push('Missing id')
    if (!manifest.name) errors.push('Missing name')
    if (!manifest.version) errors.push('Missing version')
    if (!manifest.sdkVersion) errors.push('Missing sdkVersion')
    if (!manifest.entry) errors.push('Missing entry')
    return errors
  }
}

export const pluginSubmissionService = new PluginSubmissionService()
