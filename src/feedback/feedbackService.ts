// src/feedback/feedbackService.ts — PB1-007 Feedback Service
// Stores, validates, attaches diagnostics, queues submissions, persists drafts.
// Pure TypeScript with pluggable storage.

import { TelemetrySnapshotCapture, type TelemetrySnapshot, type ITelemetryProvider } from './telemetrySnapshot'

// ── Feedback Types ──

export type FeedbackType = 'bug' | 'suggestion' | 'performance' | 'other'

export type FeedbackStatus = 'draft' | 'submitted' | 'queued' | 'sent' | 'failed'

export interface FeedbackEntry {
  id: string
  timestamp: number
  type: FeedbackType
  status: FeedbackStatus
  title: string
  description: string
  category?: string
  email?: string
  telemetrySnapshot?: TelemetrySnapshot | null
  diagnosticId?: string
  attachments: string[]
  errorMessage?: string
}

export interface FeedbackDraft {
  entry: FeedbackEntry
  lastSaved: number
}

// ── Storage Interface ──

export interface IFeedbackStorage {
  saveFeedback(entries: FeedbackEntry[]): Promise<void>
  loadFeedback(): Promise<FeedbackEntry[]>
  saveDraft(draft: FeedbackDraft): Promise<void>
  loadDraft(draftId: string): Promise<FeedbackDraft | null>
  removeDraft(draftId: string): Promise<void>
  listDrafts(): Promise<string[]>
}

// ── Memory Storage ──

export class MemoryFeedbackStorage implements IFeedbackStorage {
  private feedback: FeedbackEntry[] = []
  private drafts = new Map<string, FeedbackDraft>()

  async saveFeedback(entries: FeedbackEntry[]): Promise<void> {
    this.feedback = [...entries]
  }

  async loadFeedback(): Promise<FeedbackEntry[]> {
    return [...this.feedback]
  }

  async saveDraft(draft: FeedbackDraft): Promise<void> {
    this.drafts.set(draft.entry.id, { ...draft, lastSaved: Date.now() })
  }

  async loadDraft(draftId: string): Promise<FeedbackDraft | null> {
    return this.drafts.get(draftId) || null
  }

  async removeDraft(draftId: string): Promise<void> {
    this.drafts.delete(draftId)
  }

  async listDrafts(): Promise<string[]> {
    return Array.from(this.drafts.keys())
  }
}

// ── Validation ──

export interface FeedbackValidation {
  valid: boolean
  errors: string[]
}

// ── Feedback Service ──

export class FeedbackService {
  private storage: IFeedbackStorage
  private snapshotCapture: TelemetrySnapshotCapture
  private entries: FeedbackEntry[] = []

  constructor(storage?: IFeedbackStorage) {
    this.storage = storage || new MemoryFeedbackStorage()
    this.snapshotCapture = new TelemetrySnapshotCapture()
  }

  /** Register telemetry provider for snapshot integration */
  setTelemetryProvider(provider: ITelemetryProvider): void {
    this.snapshotCapture.setProvider(provider)
  }

  /** Validate a feedback entry */
  validate(entry: Partial<FeedbackEntry>): FeedbackValidation {
    const errors: string[] = []

    if (!entry.title || entry.title.trim().length === 0) {
      errors.push('Title is required')
    }
    if (entry.title && entry.title.length > 200) {
      errors.push('Title must be under 200 characters')
    }
    if (!entry.description || entry.description.trim().length === 0) {
      errors.push('Description is required')
    }
    if (entry.description && entry.description.length < 10) {
      errors.push('Description must be at least 10 characters')
    }
    if (!entry.type || !['bug', 'suggestion', 'performance', 'other'].includes(entry.type)) {
      errors.push('Type must be one of: bug, suggestion, performance, other')
    }

    return { valid: errors.length === 0, errors }
  }

  /** Submit feedback (validates, attaches snapshot, persists) */
  submitFeedback(params: {
    type: FeedbackType
    title: string
    description: string
    category?: string
    email?: string
    attachTelemetry?: boolean
  }): { success: boolean; entry?: FeedbackEntry; errors?: string[] } {
    // Validate
    const validation = this.validate(params)
    if (!validation.valid) {
      return { success: false, errors: validation.errors }
    }

    // Build entry
    const entry: FeedbackEntry = {
      id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      type: params.type,
      status: 'submitted',
      title: params.title.trim(),
      description: params.description.trim(),
      category: params.category,
      email: params.email,
      telemetrySnapshot: params.attachTelemetry ? this.snapshotCapture.capture() : null,
      attachments: []
    }

    this.entries.push(entry)
    this.persist()

    return { success: true, entry }
  }

  /** Save a draft for later submission */
  saveDraft(params: {
    type: FeedbackType
    title: string
    description: string
    category?: string
  }): FeedbackEntry {
    const entry: FeedbackEntry = {
      id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      type: params.type,
      status: 'draft',
      title: params.title,
      description: params.description,
      category: params.category,
      attachments: []
    }

    this.storage.saveDraft({ entry, lastSaved: Date.now() })
    return entry
  }

  /** Load a saved draft */
  async loadDraft(draftId: string): Promise<FeedbackEntry | null> {
    const draft = await this.storage.loadDraft(draftId)
    return draft ? draft.entry : null
  }

  /** Delete a draft */
  async deleteDraft(draftId: string): Promise<void> {
    await this.storage.removeDraft(draftId)
  }

  /** List all draft IDs */
  async listDrafts(): Promise<string[]> {
    return this.storage.listDrafts()
  }

  /** Attach a diagnostic snapshot to a feedback entry */
  attachDiagnostics(entryId: string): boolean {
    const entry = this.entries.find(e => e.id === entryId)
    if (!entry) return false

    entry.telemetrySnapshot = this.snapshotCapture.capture()
    this.persist()
    return true
  }

  /** Queue an entry for submission (offline support) */
  queueSubmission(entryId: string): boolean {
    const entry = this.entries.find(e => e.id === entryId)
    if (!entry) return false

    entry.status = 'queued'
    this.persist()
    return true
  }

  /** Mark queued entries as sent */
  markSent(entryId: string): boolean {
    const entry = this.entries.find(e => e.id === entryId)
    if (!entry) return false

    entry.status = 'sent'
    this.persist()
    return true
  }

  /** Mark submission as failed with error */
  markFailed(entryId: string, error: string): boolean {
    const entry = this.entries.find(e => e.id === entryId)
    if (!entry) return false

    entry.status = 'failed'
    entry.errorMessage = error
    this.persist()
    return true
  }

  /** Get all feedback entries */
  getEntries(): FeedbackEntry[] {
    return [...this.entries]
  }

  /** Get entries by status */
  getEntriesByStatus(status: FeedbackStatus): FeedbackEntry[] {
    return this.entries.filter(e => e.status === status)
  }

  /** Get the snapshot capturer for direct use */
  getSnapshotCapture(): TelemetrySnapshotCapture {
    return this.snapshotCapture
  }

  /** Persist to storage */
  private async persist(): Promise<void> {
    try {
      await this.storage.saveFeedback(this.entries)
    } catch (e) {
      console.error('[Feedback] Persist failed:', (e as Error).message)
    }
  }

  /** Load from storage */
  async initialize(): Promise<void> {
    try {
      this.entries = await this.storage.loadFeedback()
    } catch (e) {
      console.error('[Feedback] Load failed:', (e as Error).message)
      this.entries = []
    }
  }

  /** Clear all data */
  async clearAll(): Promise<void> {
    this.entries = []
    await this.storage.saveFeedback([])
  }
}
