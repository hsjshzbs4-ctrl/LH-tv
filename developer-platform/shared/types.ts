// developer-platform/shared/types.ts — P5.3 Shared Types
export type DeveloperRole = 'DEVELOPER' | 'VERIFIED_DEVELOPER' | 'REVIEWER' | 'ADMIN'

export interface DeveloperAccount {
  id: string; username: string; email: string
  organization?: string; website?: string; github?: string
  role: DeveloperRole; verified: boolean
  pluginCount: number; totalDownloads: number; rating: number
  createdAt: number
}

export interface DeveloperProfile extends DeveloperAccount {
  bio?: string; avatar?: string
}

export type ReviewState = 'SUBMITTED' | 'SCANNING' | 'UNDER_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED'

export interface PluginSubmission {
  id: string; developerId: string; manifest: Record<string, unknown>
  state: ReviewState; submittedAt: number; reviewedAt?: number; reviewerNotes?: string
}

export interface PluginAnalytics {
  pluginId: string; downloads: number; installs: number; uninstalls: number
  activeUsers: number; updateRate: number; crashRate: number
  dailyDownloads: number[]; weeklyDownloads: number[]
}

export interface PluginRating {
  pluginId: string; userId: string; version: string; score: number; review?: string; createdAt: number
}

export interface DeveloperNotification {
  id: string; developerId: string; type: 'review_approved' | 'review_rejected' | 'plugin_published' | 'plugin_removed' | 'security_warning' | 'new_version'
  title: string; message: string; read: boolean; createdAt: number
}

export type { PluginSubmission as PluginSubmissionType }
