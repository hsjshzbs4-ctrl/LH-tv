// developer-platform/review/PluginReviewService.ts
import type { PluginSubmission, ReviewState } from '../shared/types'

export class PluginReviewService {
  private queue: PluginSubmission[] = []

  addToQueue(submission: PluginSubmission): void { this.queue.push(submission) }

  getQueue(): PluginSubmission[] { return [...this.queue] }
  getByState(state: ReviewState): PluginSubmission[] { return this.queue.filter(s => s.state === state) }

  scan(submission: PluginSubmission): string[] {
    const issues: string[] = []
    const m = submission.manifest as Record<string, unknown>
    if (m.permissions) {
      for (const perm of m.permissions as string[]) {
        const dangerous = ['STORAGE_ACCESS', 'SETTINGS_ACCESS']
        if (dangerous.includes(perm)) issues.push(`Dangerous permission: ${perm}`)
      }
    }
    return issues
  }

  approve(submissionId: string): void {
    const sub = this.queue.find(s => s.id === submissionId)
    if (sub) sub.state = 'APPROVED'
  }

  reject(submissionId: string, reason: string): void {
    const sub = this.queue.find(s => s.id === submissionId)
    if (sub) { sub.state = 'REJECTED'; sub.reviewerNotes = reason }
  }

  requestChanges(submissionId: string, notes: string): void {
    const sub = this.queue.find(s => s.id === submissionId)
    if (sub) { sub.state = 'CHANGES_REQUESTED'; sub.reviewerNotes = notes }
  }
}

export const pluginReviewService = new PluginReviewService()
